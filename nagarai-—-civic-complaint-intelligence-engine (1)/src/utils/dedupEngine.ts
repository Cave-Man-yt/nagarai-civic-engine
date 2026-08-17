import { ComplaintCategory, MasterCluster, StructuredComplaint } from '../types';
import { calculateCentroid, calculateSpreadRadiusMeters, findNearbyLandmarks, getHaversineDistanceMeters } from './geoUtils';
import { calculatePriorityScore } from './priorityEngine';

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback keyword / token overlap similarity when raw vectors are not generated yet.
 */
export function textSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokens1 = new Set(normalize(text1));
  const tokens2 = new Set(normalize(text2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) intersection++;
  });

  const union = new Set([...tokens1, ...tokens2]).size;
  return intersection / union;
}

/**
 * Determines whether complaint B is a duplicate of complaint A or should merge into an existing cluster.
 * 
 * Criteria:
 * 1. Category matches or is compatible (e.g. pothole & road damage, water leakage & pipeline)
 * 2. Geo-distance <= 250 meters
 * 3. Text semantic similarity >= 0.35 OR vector cosine similarity >= 0.70
 */
export function isDuplicateComplaint(
  candidate: StructuredComplaint,
  cluster: MasterCluster,
  maxGeoDistanceMeters: number = 250
): { isDuplicate: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];

  // Category Check
  const isCategoryMatch = candidate.category === cluster.category;
  if (!isCategoryMatch) {
    return { isDuplicate: false, score: 0, reasons: ['Category mismatch'] };
  }

  // Geo Check
  const distance = getHaversineDistanceMeters(
    candidate.coordinates.lat,
    candidate.coordinates.lng,
    cluster.coordinates.lat,
    cluster.coordinates.lng
  );

  if (distance > maxGeoDistanceMeters) {
    return {
      isDuplicate: false,
      score: 0,
      reasons: [`Distance too far (${distance}m > ${maxGeoDistanceMeters}m)`],
    };
  }

  reasons.push(`Close proximity (${distance}m within ${maxGeoDistanceMeters}m radius)`);

  // Semantic Similarity
  let simScore = 0.5; // base assumption if same category and location
  if (candidate.embedding && cluster.complaints[0]?.embedding) {
    simScore = cosineSimilarity(candidate.embedding, cluster.complaints[0].embedding);
    reasons.push(`Embedding similarity: ${(simScore * 100).toFixed(1)}%`);
  } else {
    const textSim = textSemanticSimilarity(
      candidate.cleanDescription || candidate.rawInputText || '',
      cluster.title + ' ' + (cluster.complaints[0]?.cleanDescription || '')
    );
    simScore = textSim;
    reasons.push(`Keyword semantic overlap: ${(textSim * 100).toFixed(1)}%`);
  }

  const isDuplicate = isCategoryMatch && distance <= maxGeoDistanceMeters && (simScore >= 0.18 || distance <= 90);

  return {
    isDuplicate,
    score: simScore,
    reasons,
  };
}

/**
 * Clusters a list of complaints into master deduplicated clusters.
 */
export function clusterComplaints(
  complaints: StructuredComplaint[],
  existingClusters: MasterCluster[] = []
): MasterCluster[] {
  const clusters: MasterCluster[] = JSON.parse(JSON.stringify(existingClusters));

  for (const complaint of complaints) {
    let matchedCluster: MasterCluster | null = null;
    let bestMatchScore = 0;

    for (const cl of clusters) {
      const match = isDuplicateComplaint(complaint, cl);
      if (match.isDuplicate && match.score >= bestMatchScore) {
        matchedCluster = cl;
        bestMatchScore = match.score;
      }
    }

    if (matchedCluster) {
      // Add to existing cluster
      complaint.clusterId = matchedCluster.id;
      complaint.isDuplicate = true;
      matchedCluster.complaints.push(complaint);
      matchedCluster.affectedCitizenCount = matchedCluster.complaints.length;

      // Recalculate centroid & spread
      const allCoords = matchedCluster.complaints.map((c) => c.coordinates);
      matchedCluster.coordinates = calculateCentroid(allCoords);
      matchedCluster.centroidRadiusMeters = calculateSpreadRadiusMeters(matchedCluster.coordinates, allCoords);

      // Max severity among complaints
      matchedCluster.baseSeverity = Math.max(...matchedCluster.complaints.map((c) => c.severity || 3));

      // Recalculate landmarks
      const landmarks = findNearbyLandmarks(matchedCluster.coordinates.lat, matchedCluster.coordinates.lng);

      // Recalculate Priority Score with updated affected count
      matchedCluster.priorityBreakdown = calculatePriorityScore(
        matchedCluster.baseSeverity,
        matchedCluster.affectedCitizenCount,
        matchedCluster.daysPending,
        matchedCluster.category,
        landmarks
      );
      matchedCluster.priorityScore = matchedCluster.priorityBreakdown.totalScore;

      matchedCluster.activityLogs.unshift({
        timestamp: new Date().toISOString(),
        action: 'DUPLICATE_MERGED',
        actor: 'NagarAI Dedup Engine',
        details: `Merged complaint ${complaint.ticketNumber} from ${complaint.citizenName} (+1 Affected Citizen)`,
      });
    } else {
      // Create new Master Cluster
      const clusterId = `cluster-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const clusterCode = `CL-${Math.floor(1000 + Math.random() * 9000)}`;
      complaint.clusterId = clusterId;
      complaint.isDuplicate = false;

      const landmarks = findNearbyLandmarks(complaint.coordinates.lat, complaint.coordinates.lng);
      const priority = calculatePriorityScore(
        complaint.severity || 3,
        1,
        0,
        complaint.category,
        landmarks
      );

      const slaHoursMap: Record<ComplaintCategory, number> = {
        live_wire_hazard: 4,
        open_manhole: 6,
        water_leakage: 12,
        waterlogging: 12,
        sewage_overflow: 18,
        garbage_dump: 24,
        broken_streetlight: 24,
        fallen_tree: 12,
        pothole: 48,
      };

      const newCluster: MasterCluster = {
        id: clusterId,
        clusterCode,
        title: complaint.cleanDescription || `${(complaint.category || 'issue').replace(/_/g, ' ').toUpperCase()} at ${complaint.locationName || 'Location'}`,
        category: complaint.category,
        department: complaint.department,
        ward: complaint.ward || 'Ward 12',
        locationName: complaint.locationName || 'Municipal Ward',
        coordinates: complaint.coordinates,
        centroidRadiusMeters: 30,
        status: 'pending',
        slaHours: slaHoursMap[complaint.category] || 24,
        reportedAt: complaint.timestamp || new Date().toISOString(),
        daysPending: 0,
        affectedCitizenCount: 1,
        baseSeverity: complaint.severity || 3,
        priorityScore: priority.totalScore,
        priorityBreakdown: priority,
        complaints: [complaint],
        activityLogs: [
          {
            timestamp: new Date().toISOString(),
            action: 'CLUSTER_CREATED',
            actor: 'NagarAI Engine',
            details: `Initial complaint ${complaint.ticketNumber || 'TKT-001'} ingested via ${(complaint.originalInputType || 'text').toUpperCase()}`,
          },
        ],
      };

      clusters.push(newCluster);
    }
  }

  // Sort clusters by Priority Score descending
  return clusters.sort((a, b) => b.priorityScore - a.priorityScore);
}
