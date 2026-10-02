"""Numerical edge cases for the publication-share position map."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("scientific_plots", Path(__file__).with_name("scientific-plots.py"))
plots = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plots)


class PositionTests(unittest.TestCase):
    def topic(self, **updates):
        return dict(id="test", nP1=10, nP2=20, worldP1=100, worldP2=400,
                    worldShareChange=1.5, ownWorldShareChange=-0.5, **updates)

    def test_more_papers_can_still_mean_losing_world_share(self):
        self.assertEqual(plots.position_coordinates(self.topic()), (150, -50))

    def test_zero_baseline_is_undefined_but_fall_to_zero_is_real(self):
        value = self.topic()
        value.update(nP1=0, ownWorldShareChange=None)
        self.assertIsNone(plots.position_coordinates(value))
        value.update(ownWorldShareChange=0)
        with self.assertRaises(ValueError):
            plots.position_coordinates(value)
        value.update(nP1=10, nP2=0, ownWorldShareChange=-1)
        self.assertEqual(plots.position_coordinates(value), (150, -100))

    def test_missing_world_counts_do_not_produce_coordinates(self):
        value = self.topic()
        value.update(worldP1=None, ownWorldShareChange=None)
        self.assertIsNone(plots.position_coordinates(value))

    def test_rounding_is_allowed_but_a_wrong_ratio_is_rejected(self):
        value = self.topic()
        value.update(nP1=3, nP2=1, worldP1=100, worldP2=100, ownWorldShareChange=-0.666667)
        self.assertEqual(plots.position_coordinates(value), (150, -66.6667))
        value.update(ownWorldShareChange=0.666667)
        with self.assertRaises(ValueError):
            plots.position_coordinates(value)


if __name__ == "__main__":
    unittest.main()
