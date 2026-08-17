"""
End-to-End Pipeline Test for NagarAI Civic Intelligence Engine
Tests Task 4 Deduplication & Task 5 Priority Score Calculation.
"""

import unittest
from deduplicator import ComplaintClusterStore, check_and_merge_complaint, calculate_priority_score


class TestDeduplicationPipeline(unittest.TestCase):

    def setUp(self):
        self.store = ComplaintClusterStore()

    def test_deduplication_and_priority_increment(self):
        # Coordinates: MG Road, Connaught Place, New Delhi (28.6315, 77.2167)
        base_lat = 28.6315
        base_lon = 77.2167

        # 1. Report 1: First complaint about pothole
        comp1 = {
            "report_id": "rep_101",
            "latitude": base_lat,
            "longitude": base_lon,
            "raw_text": "There is a very deep dangerous pothole near the Metro station entrance on MG Road.",
            "is_sensitive_location": True
        }
        res1 = check_and_merge_complaint(comp1, store=self.store)
        print("\n--- Report 1 Result ---")
        print(f"Action: {res1['action']}, Cluster ID: {res1['cluster_id']}, Priority: {res1['priority_score']}, Affected: {res1['affected_citizens']}")
        
        self.assertEqual(res1["action"], "created")
        self.assertEqual(res1["affected_citizens"], 1)
        initial_cluster_id = res1["cluster_id"]
        initial_priority = res1["priority_score"]

        # 2. Report 2: Second complaint 15 meters away about the same pothole
        comp2 = {
            "report_id": "rep_102",
            "latitude": base_lat + 0.0001,  # ~11 meters away
            "longitude": base_lon + 0.0001,
            "raw_text": "Huge pothole in front of metro gate on MG Road. Vehicles are getting damaged.",
            "is_sensitive_location": True
        }
        res2 = check_and_merge_complaint(comp2, store=self.store)
        print("\n--- Report 2 Result ---")
        print(f"Action: {res2['action']}, Cluster ID: {res2['cluster_id']}, Priority: {res2['priority_score']}, Affected: {res2['affected_citizens']}, Similarity: {res2['similarity']}")
        
        self.assertEqual(res2["action"], "merged")
        self.assertEqual(res2["cluster_id"], initial_cluster_id)
        self.assertEqual(res2["affected_citizens"], 2)
        self.assertGreater(res2["priority_score"], initial_priority)

        # 3. Report 3: Third complaint 25 meters away in Hindi
        comp3 = {
            "report_id": "rep_103",
            "latitude": base_lat - 0.0001,
            "longitude": base_lon - 0.0001,
            "raw_text": "MG Road metro station ke paas vada gadda hai sadak par.",
            "is_sensitive_location": True
        }
        res3 = check_and_merge_complaint(comp3, store=self.store)
        print("\n--- Report 3 Result ---")
        print(f"Action: {res3['action']}, Cluster ID: {res3['cluster_id']}, Priority: {res3['priority_score']}, Affected: {res3['affected_citizens']}")
        
        self.assertEqual(res3["action"], "merged")
        self.assertEqual(res3["cluster_id"], initial_cluster_id)
        self.assertEqual(res3["affected_citizens"], 3)
        self.assertGreater(res3["priority_score"], res2["priority_score"])

        # 4. Report 4: Separate complaint 2 km away (different location)
        comp4 = {
            "report_id": "rep_104",
            "latitude": base_lat + 0.02, # ~2.2 km away
            "longitude": base_lon + 0.02,
            "raw_text": "Streetlight is not working near Sector 4 community park.",
            "is_sensitive_location": False
        }
        res4 = check_and_merge_complaint(comp4, store=self.store)
        print("\n--- Report 4 Result (Distant Location) ---")
        print(f"Action: {res4['action']}, Cluster ID: {res4['cluster_id']}, Priority: {res4['priority_score']}")
        
        self.assertEqual(res4["action"], "created")
        self.assertNotEqual(res4["cluster_id"], initial_cluster_id)


if __name__ == "__main__":
    unittest.main()
