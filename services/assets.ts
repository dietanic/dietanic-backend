
import { Asset } from '../types';
import { DB } from './storage';

const KEY = 'dietanic_assets';

export const AssetService = {
    getAssets: () => DB.getAll<Asset>(KEY, []),
    disposeAsset: async (id: string) => { const a = await DB.getById<Asset>(KEY, id); if(a) { a.status='disposed'; await DB.update(KEY, a); } },
    calculateCurrentValue: (a: Asset) => {
        const y = new Date().getFullYear();
        const e = a.depreciationSchedule.find(x => x.year === y);
        return e ? e.startValue : a.cost;
    },
    addAsset: async (a: Asset) => {
        const ann = (a.cost - a.salvageValue) / a.usefulLifeYears;
        let val = a.cost;
        const start = new Date(a.purchaseDate).getFullYear();
        for(let i=0; i<a.usefulLifeYears; i++) {
            const exp = Math.min(val - a.salvageValue, ann);
            a.depreciationSchedule.push({ year: start+i, startValue: val, depreciationExpense: exp, endValue: val-exp });
            val -= exp;
        }
        await DB.add(KEY, a);
    }
};
