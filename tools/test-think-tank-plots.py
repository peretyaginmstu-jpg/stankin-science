#!/usr/bin/env python3
import copy
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('think_plots',Path(__file__).with_name('think-tank-plots.py'))
plots=importlib.util.module_from_spec(spec);spec.loader.exec_module(plots)

def fixture():
    return {'schema':1,'checks':[{'passed':True}], 'directions':[{'mappingStatus':'reviewed','pareto':{'eligible':True}} for _ in range(8)],
      'institution':{'indicators':[{'name':{'ru':'Аспиранты','en':'Postgraduates'},'unit':'count','comparable':True,
        'comparison':{'fromYear':2020,'toYear':2025,'relative':-.1,'status':'comparable'},
        'observations':[{'year':2020,'value':100,'sourceId':'a','page':1},{'year':2025,'value':90,'sourceId':'b','page':2}]}]}}

class PlotsTest(unittest.TestCase):
    def test_failed_checks_and_fake_growth_are_rejected(self):
        data=fixture();plots.validate(data)
        data['checks'][0]['passed']=False
        with self.assertRaises(ValueError):plots.validate(data)
        data=fixture();data['institution']['indicators'][0]['comparable']=False
        with self.assertRaises(ValueError):plots.validate(data)
    def test_missing_is_not_zero_and_zero_axes_are_preserved(self):
        data=fixture();item=data['institution']['indicators'][0]
        item['observations'][0]['value']=None;item['comparison']['status']='missing';item['comparison']['relative']=None
        plots.validate(data);fig=plots.institution(data,'ru')
        ax=fig.axes[0];self.assertEqual(ax.get_xlim()[0],0)
        self.assertEqual(len(ax.patches),1)
        self.assertTrue(any('Нет данных' in t.get_text() for t in ax.texts))
        plots.plt.close(fig)
    def test_adjacent_mapping_cannot_claim_pareto_status(self):
        data=fixture();data['directions'][0]['mappingStatus']='adjacent'
        with self.assertRaises(ValueError):plots.validate(data)

if __name__=='__main__':unittest.main()
