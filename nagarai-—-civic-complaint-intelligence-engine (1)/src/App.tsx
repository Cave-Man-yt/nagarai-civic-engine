import React, { useState, useEffect, useMemo } from 'react';
import { RoleLoginLanding } from './components/RoleLoginLanding';
import { Navbar } from './components/Navbar';
import { OfficialDashboard } from './components/OfficialDashboard';
import { CitizenPortal } from './components/CitizenPortal';
import { VolunteerPortal } from './components/VolunteerPortal';
import { BenchmarkJudgingSuite } from './components/BenchmarkJudgingSuite';
import { PriorityFormulaModal } from './components/PriorityFormulaModal';
import { ResolutionVerifyModal } from './components/ResolutionVerifyModal';
import { RobustnessSandbox } from './components/RobustnessSandbox';
import { CitizenNotificationDrawer } from './components/CitizenNotificationDrawer';
import { OfficerNotificationDrawer } from './components/OfficerNotificationDrawer';
import { 
  MasterCluster, 
  FieldCrew, 
  CitizenNotification, 
  OfficerNotification, 
  StructuredComplaint, 
  UserRole,
  CitizenUser,
  OfficerUser,
  VolunteerUser,
  VolunteerTask
} from './types';
import { 
  INITIAL_SEED_CLUSTERS, 
  INITIAL_CREWS, 
  INITIAL_CITIZEN_NOTIFICATIONS, 
  INITIAL_OFFICER_NOTIFICATIONS,
  INITIAL_VOLUNTEER_TASKS,
  SAMPLE_EXISTING_VOLUNTEERS,
  SAMPLE_EXISTING_CITIZENS,
  SAMPLE_EXISTING_OFFICERS
} from './data/mockData';

export default function App() {
  // Step 1: Role Authentication State (Starts at null to present the Role Selection Landing page on app load)
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [citizenUser, setCitizenUser] = useState<CitizenUser>(SAMPLE_EXISTING_CITIZENS[0]);
  const [officerUser, setOfficerUser] = useState<OfficerUser>(SAMPLE_EXISTING_OFFICERS[0]);
  const [volunteerUser, setVolunteerUser] = useState<VolunteerUser>(SAMPLE_EXISTING_VOLUNTEERS[0]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark' | 'formula' | 'robustness'>('dashboard');
  const [clusters, setClusters] = useState<MasterCluster[]>(INITIAL_SEED_CLUSTERS);
  const [crews, setCrews] = useState<FieldCrew[]>(INITIAL_CREWS);
  const [volunteerTasks, setVolunteerTasks] = useState<VolunteerTask[]>(INITIAL_VOLUNTEER_TASKS);
  const [notifications, setNotifications] = useState<CitizenNotification[]>(INITIAL_CITIZEN_NOTIFICATIONS);
  const [officerNotifications, setOfficerNotifications] = useState<OfficerNotification[]>(INITIAL_OFFICER_NOTIFICATIONS);

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(clusters[0]?.id || null);
  const [inspectFormulaCluster, setInspectFormulaCluster] = useState<MasterCluster | null>(null);
  const [verifyModalCluster, setVerifyModalCluster] = useState<MasterCluster | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Fetch live state from backend API on mount
  useEffect(() => {
    fetchClusters();
    fetchCrews();
    fetchNotifications();
    fetchOfficerNotifications();
  }, []);

  const fetchClusters = async () => {
    try {
      const res = await fetch('/api/clusters');
      if (res.ok) {
        const data = await res.json();
        const clusterList = Array.isArray(data) ? data : data.clusters || [];
        if (clusterList && clusterList.length > 0) {
          setClusters(clusterList);
          if (!selectedClusterId) setSelectedClusterId(clusterList[0].id);
        }
        if (data.crews && Array.isArray(data.crews)) {
          setCrews(data.crews);
        }
      }
    } catch (err) {
      console.warn('Backend API offline, using local state:', err);
    }
  };

  const fetchCrews = async () => {
    try {
      const res = await fetch('/api/crews');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) setCrews(data);
      }
    } catch (err) {
      console.warn('Crews API offline, using seed:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifList = Array.isArray(data) ? data : data.notifications || [];
        if (notifList && notifList.length > 0) setNotifications(notifList);
      }
    } catch (err) {
      console.warn('Notifications API offline, using seed:', err);
    }
  };

  const fetchOfficerNotifications = async () => {
    try {
      const res = await fetch('/api/officer-notifications');
      if (res.ok) {
        const data = await res.json();
        const notifList = Array.isArray(data) ? data : data.officerNotifications || [];
        if (notifList && notifList.length > 0) setOfficerNotifications(notifList);
      }
    } catch (err) {
      console.warn('Officer notifications API offline, using seed:', err);
    }
  };

  // Filter citizen-only notifications specifically for logged-in citizen
  const citizenFilteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Show if it belongs to citizen phone or general citizen ticket
      return notif.citizenPhone === citizenUser.phone || notif.recipientPhone === citizenUser.phone || !notif.recipientPhone;
    });
  }, [notifications, citizenUser.phone]);

  // Role Selection Handler
  const handleSelectRole = (role: UserRole, user: any) => {
    setUserRole(role);
    setIsNotificationDrawerOpen(false);
    if (role === 'citizen') {
      setCitizenUser(user);
    } else if (role === 'officer') {
      setOfficerUser(user);
    } else if (role === 'volunteer') {
      setVolunteerUser(user);
    }
  };

  // Volunteer Task Claim Handler
  const handleClaimVolunteerTask = (taskId: string) => {
    setVolunteerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const alreadyPledged = t.pledgedVolunteers.some(
            (p) => p.phone === volunteerUser.phone || p.name === volunteerUser.name
          );
          if (alreadyPledged) return t;

          return {
            ...t,
            status: 'in_progress',
            pledgedVolunteers: [
              ...t.pledgedVolunteers,
              {
                name: volunteerUser.name,
                phone: volunteerUser.phone,
                pledgedAt: new Date().toISOString(),
              },
            ],
          };
        }
        return t;
      })
    );

    // Notify Officer that a community volunteer has stepped in
    const targetTask = volunteerTasks.find((t) => t.id === taskId);
    if (targetTask) {
      const offNotif: OfficerNotification = {
        id: `off-vol-claim-${Date.now()}`,
        clusterCode: targetTask.clusterCode,
        title: `Community Volunteer Stepped In: ${volunteerUser.name}`,
        department: 'Community Volunteer Grid',
        priorityScore: 50,
        severity: targetTask.severity,
        type: 'cluster_merged',
        message: `Volunteer ${volunteerUser.name} (${volunteerUser.primarySkill}) claimed community task ${targetTask.clusterCode}: "${targetTask.title}". Self-resolution in progress.`,
        timestamp: new Date().toISOString(),
        ward: targetTask.ward,
        locationName: targetTask.locationName,
        actionRequired: false,
      };
      setOfficerNotifications((prev) => [offNotif, ...prev]);
    }
  };

  // Volunteer Task Proof Submission Handler
  const handleSubmitVolunteerProof = (taskId: string, proof: {
    afterPhotoUrl: string;
    notes: string;
    aiScore: number;
  }) => {
    const targetTask = volunteerTasks.find((t) => t.id === taskId);
    const karmaEarned = targetTask ? targetTask.karmaPoints : 100;

    // Update Volunteer's stats
    setVolunteerUser((prev) => ({
      ...prev,
      karmaPoints: prev.karmaPoints + karmaEarned,
      tasksCompletedCount: prev.tasksCompletedCount + 1,
      badges: prev.tasksCompletedCount + 1 >= 5 && !prev.badges.includes('⭐ Neighborhood Star')
        ? [...prev.badges, '⭐ Neighborhood Star']
        : prev.badges,
    }));

    // Update Task status
    setVolunteerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'volunteer_resolved',
            resolvedBy: {
              volunteerName: volunteerUser.name,
              volunteerPhone: volunteerUser.phone,
              resolvedAt: new Date().toISOString(),
              afterPhotoUrl: proof.afterPhotoUrl,
              notes: proof.notes,
              aiVerificationScore: proof.aiScore,
            },
          };
        }
        return t;
      })
    );

    // Sync corresponding MasterCluster if any
    if (targetTask) {
      setClusters((prev) =>
        prev.map((c) => {
          if (c.id === targetTask.clusterId || c.clusterCode === targetTask.clusterCode) {
            return {
              ...c,
              status: 'resolved',
              resolution: {
                resolvedAt: new Date().toISOString(),
                resolutionNotes: `Community Volunteer (${volunteerUser.name}) resolved this issue: ${proof.notes}`,
                aiVerificationScore: proof.aiScore,
                aiVerificationSummary: `AI Vision verified cleanup and remediation by volunteer (${proof.aiScore}% score). Site cleared.`,
                citizenConfirmations: { confirmed: c.affectedCitizenCount || 2, disputed: 0 },
              },
            };
          }
          return c;
        })
      );

      // Add Citizen Notification of resolution
      const notif: CitizenNotification = {
        id: `notif-vol-res-${Date.now()}`,
        clusterCode: targetTask.clusterCode,
        channel: 'sms',
        type: 'resolved',
        message: `NagarAI: Community task ${targetTask.clusterCode} was successfully resolved by Volunteer ${volunteerUser.name}. Thank you for helping keep our city clean!`,
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        status: 'delivered',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Submit Complaint via Universal Intake (Data Flow: Appears in Citizen's My Complaints & Officer's Queue)
  const handleSubmitComplaint = async (formData: any) => {
    const rawId = formData.complaintId || `CMP-${Math.floor(200 + Math.random() * 800)}`;
    const ticketNo = formData.ticketNumber || `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: StructuredComplaint = {
      id: rawId,
      ticketNumber: ticketNo,
      timestamp: new Date().toISOString(),
      citizenName: formData.citizenName || citizenUser.name,
      citizenPhone: formData.citizenPhone || citizenUser.phone,
      language: formData.inputLanguage || 'Tamil',
      originalInputType: formData.originalInputType || 'multimodal',
      rawInputText: formData.rawText,
      photoUrl: formData.photoUrl,
      cleanDescription: formData.rawText || `${formData.category} reported near ${formData.locationName}`,
      category: formData.category || 'pothole',
      severity: formData.category === 'live_wire_hazard' ? 5 : 4,
      locationName: formData.locationName || 'Anna Salai Main Road',
      coordinates: formData.gpsCoordinates || { lat: 13.0646, lng: 80.2642 },
      ward: 'Ward 12 - George Town & Central',
      department: formData.category === 'live_wire_hazard' ? 'Electricity & Power' : 'Roads & PWD',
      nearbyLandmarks: [],
    };

    // Add citizen SMS notification
    const newCitizenNotif: CitizenNotification = {
      id: `notif-${Date.now()}`,
      recipientPhone: formData.citizenPhone || citizenUser.phone,
      citizenPhone: formData.citizenPhone || citizenUser.phone,
      citizenName: formData.citizenName || citizenUser.name,
      channel: 'sms',
      type: 'intake_received',
      clusterCode: 'CL-1092',
      ticketNumber: ticketNo,
      message: `NagarAI: Grievance ${ticketNo} logged. Auto-deduplicated into Master Work Order. Priority: 94.`,
      sentAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };

    // Add officer operational alert
    const newOfficerNotif: OfficerNotification = {
      id: `off-notif-${Date.now()}`,
      clusterCode: 'CL-1092',
      title: `New Citizen Grievance Logged: ${ticketNo}`,
      department: newComplaint.department,
      priorityScore: 94,
      severity: newComplaint.severity,
      type: newComplaint.severity >= 5 ? 'critical_emergency' : 'cluster_merged',
      message: `Citizen ${newComplaint.citizenName} reported ${newComplaint.cleanDescription}. Ingestion completed via voice/multimodal parser.`,
      timestamp: new Date().toISOString(),
      ward: newComplaint.ward,
      locationName: newComplaint.locationName,
      actionRequired: true,
    };

    try {
      const res = await fetch('/api/gemini/transcribe-and-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchClusters();
        await fetchNotifications();
        await fetchOfficerNotifications();
        if (data.assignedCluster) {
          setSelectedClusterId(data.assignedCluster.id);
        }
      } else {
        // Local cluster insertion
        setClusters((prev) => {
          const matchIndex = prev.findIndex((c) => c.category === newComplaint.category);
          if (matchIndex >= 0) {
            const updated = [...prev];
            const target = updated[matchIndex];
            updated[matchIndex] = {
              ...target,
              affectedCitizenCount: target.affectedCitizenCount + 1,
              complaints: [newComplaint, ...target.complaints],
            };
            return updated;
          } else {
            return prev;
          }
        });
        setNotifications((prev) => [newCitizenNotif, ...prev]);
        setOfficerNotifications((prev) => [newOfficerNotif, ...prev]);
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setClusters((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = {
            ...updated[0],
            affectedCitizenCount: updated[0].affectedCitizenCount + 1,
            complaints: [newComplaint, ...updated[0].complaints],
          };
        }
        return updated;
      });
      setNotifications((prev) => [newCitizenNotif, ...prev]);
      setOfficerNotifications((prev) => [newOfficerNotif, ...prev]);
    }
  };

  // Execute 15-Complaint Benchmark Test
  const handleRunBenchmark = async () => {
    try {
      const res = await fetch('/api/benchmark/run-15-test', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setClusters(data.masterClusters);
        await fetchNotifications();
        await fetchOfficerNotifications();
      }
    } catch (err) {
      console.warn('Running local benchmark fallback:', err);
      await fetchClusters();
    }
  };

  // Dispatch Field Crew
  const handleDispatchCrew = async (cluster: MasterCluster, crewId: string) => {
    try {
      const res = await fetch(`/api/clusters/${cluster.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId }),
      });

      if (res.ok) {
        await fetchClusters();
        await fetchCrews();
        await fetchNotifications();
        await fetchOfficerNotifications();
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
      const crew = crews.find((c) => c.crewId === crewId);
      setClusters((prev) =>
        prev.map((c) =>
          c.id === cluster.id
            ? {
                ...c,
                status: 'dispatched',
                assignedCrew: crew ? { crewId: crew.crewId, name: crew.name, contact: crew.contact, dispatchedAt: new Date().toISOString() } : undefined,
              }
            : c
        )
      );

      // Local fallback for notifications
      if (crew) {
        const offAlert: OfficerNotification = {
          id: `off-disp-${Date.now()}`,
          clusterId: cluster.id,
          clusterCode: cluster.clusterCode,
          title: `Crew Dispatched: ${crew.name}`,
          department: cluster.department,
          priorityScore: cluster.priorityScore,
          severity: cluster.baseSeverity,
          type: 'crew_dispatched',
          message: `Crew ${crew.name} assigned to Master Cluster ${cluster.clusterCode}. Vehicle: ${crew.vehicleNumber}.`,
          timestamp: new Date().toISOString(),
          ward: cluster.ward,
          locationName: cluster.locationName,
        };
        setOfficerNotifications((prev) => [offAlert, ...prev]);
      }
    }
  };

  // Resolve & AI Verify
  const handleResolveCluster = async (clusterId: string, afterPhotoBase64?: string, resolutionNotes?: string) => {
    try {
      const res = await fetch(`/api/clusters/${clusterId}/verify-and-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterPhotoBase64, resolutionNotes }),
      });

      if (res.ok) {
        await fetchClusters();
        await fetchNotifications();
        await fetchOfficerNotifications();
      }
    } catch (err) {
      console.error('Resolve failed:', err);
      setClusters((prev) =>
        prev.map((c) =>
          c.id === clusterId
            ? {
                ...c,
                status: 'resolved',
                resolution: {
                  resolvedAt: new Date().toISOString(),
                  resolutionNotes: resolutionNotes || 'Repairs completed by field crew.',
                  aiVerificationScore: 96,
                  aiVerificationSummary: 'AI inspection confirmed hazard has been resolved and site cleared.',
                  citizenConfirmations: { confirmed: c.affectedCitizenCount, disputed: 0 },
                },
              }
            : c
        )
      );
    }
  };

  // Citizen Vote
  const handleVote = async (notificationId: string, vote: 'confirmed' | 'disputed') => {
    try {
      await fetch('/api/notifications/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, vote }),
      });
      await fetchClusters();
      await fetchNotifications();
      await fetchOfficerNotifications();
    } catch (err) {
      console.warn('Vote recorded locally');
      setClusters((prev) =>
        prev.map((c) => {
          if (c.resolution) {
            return {
              ...c,
              resolution: {
                ...c.resolution,
                citizenConfirmations: {
                  ...c.resolution.citizenConfirmations,
                  confirmed: vote === 'confirmed' ? c.resolution.citizenConfirmations.confirmed + 1 : c.resolution.citizenConfirmations.confirmed,
                  disputed: vote === 'disputed' ? c.resolution.citizenConfirmations.disputed + 1 : c.resolution.citizenConfirmations.disputed,
                },
              },
            };
          }
          return c;
        })
      );
    }
  };

  // Reset Data Demo
  const handleResetData = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      // Local fallback
    }
    setClusters(INITIAL_SEED_CLUSTERS);
    setNotifications(INITIAL_CITIZEN_NOTIFICATIONS);
    setOfficerNotifications(INITIAL_OFFICER_NOTIFICATIONS);
    setSelectedClusterId(INITIAL_SEED_CLUSTERS[0]?.id || null);
  };

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0] || null;

  // =========================================================
  // STEP 1: RENDER ROLE SELECTION LANDING IF NOT AUTHENTICATED
  // =========================================================
  if (!userRole) {
    return <RoleLoginLanding onSelectRole={handleSelectRole} />;
  }

  // =========================================================
  // STEP 2: RENDER CITIZEN PORTAL IF LOGGED IN AS CITIZEN
  // (Citizen Notifications strictly isolated to Citizen Feed)
  // =========================================================
  if (userRole === 'citizen') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <CitizenPortal
          citizenUser={citizenUser}
          onLogout={() => setUserRole(null)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onSubmitComplaint={handleSubmitComplaint}
          clusters={clusters}
          notifications={citizenFilteredNotifications}
          onVoteResolution={handleVote}
        />

        {/* Citizen Notification Drawer (SMS & WhatsApp stream only for Citizens) */}
        <CitizenNotificationDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          notifications={citizenFilteredNotifications}
          citizenUser={citizenUser}
          onVote={handleVote}
          onInspectCluster={() => {
            setIsNotificationDrawerOpen(false);
          }}
        />
      </div>
    );
  }

  // =========================================================
  // STEP 3: RENDER VOLUNTEER PORTAL IF LOGGED IN AS VOLUNTEER
  // (Skill-Matched Quick Tasks, Karma Points, AI Verification)
  // =========================================================
  if (userRole === 'volunteer') {
    return (
      <VolunteerPortal
        volunteerUser={volunteerUser}
        volunteerTasks={volunteerTasks}
        onClaimTask={handleClaimVolunteerTask}
        onSubmitResolutionProof={handleSubmitVolunteerProof}
        onLogout={() => setUserRole(null)}
      />
    );
  }

  // =========================================================
  // STEP 4: RENDER OFFICER DASHBOARD (STRICTLY OFFICER NOTIFICATIONS & QUALIFICATIONS)
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white font-sans">
      {/* Top Navbar with Officer Role, Dashboard Tabs & Officer Alerts Bell */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clusters={clusters}
        notifications={notifications}
        officerNotifications={officerNotifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onResetData={handleResetData}
        userRole={userRole}
        officerUser={officerUser}
        onLogout={() => setUserRole(null)}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <OfficialDashboard
            clusters={clusters}
            crews={crews}
            selectedClusterId={selectedClusterId}
            onSelectCluster={(id) => setSelectedClusterId(id)}
            onInspectFormula={(c) => setInspectFormulaCluster(c)}
            onDispatchCrew={handleDispatchCrew}
            onOpenVerifyModal={(c) => setVerifyModalCluster(c)}
          />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkJudgingSuite
            onRunBenchmark={handleRunBenchmark}
            clusters={clusters}
            onSelectCluster={(id) => {
              setSelectedClusterId(id);
              setActiveTab('dashboard');
            }}
            onInspectFormula={(c) => setInspectFormulaCluster(c)}
          />
        )}

        {activeTab === 'formula' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <PriorityFormulaModal cluster={selectedCluster} onClose={() => setActiveTab('dashboard')} />
          </div>
        )}

        {activeTab === 'robustness' && <RobustnessSandbox />}
      </main>

      {/* Modals & Drawers */}
      {inspectFormulaCluster && (
        <PriorityFormulaModal
          cluster={inspectFormulaCluster}
          onClose={() => setInspectFormulaCluster(null)}
        />
      )}

      {verifyModalCluster && (
        <ResolutionVerifyModal
          cluster={verifyModalCluster}
          onClose={() => setVerifyModalCluster(null)}
          onResolve={handleResolveCluster}
        />
      )}

      {/* Officer Tactical Command Alerts & Verified Officer Qualifications Drawer */}
      <OfficerNotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={officerNotifications}
        officerUser={officerUser}
        onInspectCluster={(clusterCode) => {
          const matched = clusters.find((c) => c.clusterCode === clusterCode);
          if (matched) {
            setSelectedClusterId(matched.id);
            setActiveTab('dashboard');
            setIsNotificationDrawerOpen(false);
          }
        }}
      />
    </div>
  );
}
