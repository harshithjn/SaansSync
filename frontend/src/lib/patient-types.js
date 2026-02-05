"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERSONALIZED_ALERT_TYPES = exports.PFT_RANGES = exports.DRUG_NAME_OPTIONS = exports.FREQUENCY_LIST = exports.ROUTE_OPTIONS = exports.CO_MORBIDITIES_LIST = exports.SARCOIDOSIS_STAGES = exports.CTD_TYPES = exports.POST_ICU_SUBTYPES = exports.BRONCHIECTASIS_SUBTYPES = exports.COPD_SUBTYPES = exports.OAD_SUBTYPES = exports.ILD_SUBTYPES = exports.PRIMARY_DIAGNOSIS_CATEGORIES = void 0;
// Primary Diagnosis Categories
exports.PRIMARY_DIAGNOSIS_CATEGORIES = [
    "Interstitial Lung Disease (ILD)",
    "Bronchial Asthma",
    "COPD (Chronic Obstructive Pulmonary Disease)",
    "Bronchiectasis",
    "Post ICU Recovery"
];
// Disease Classification Constants
exports.ILD_SUBTYPES = [
    "Idiopathic pulmonary fibrosis",
    "Hypersensitivity pneumonitis",
    "Idiopathic NSIP",
    "CTD-ILD",
    "IPAF",
    "Sarcoidosis",
    "Occupational ILD",
    "COP",
    "RB-ILD",
    "DIP",
    "AIP",
    "Idiopathic pleuro-parenchymal fibroelastosis",
    "LIP",
    "LCH",
    "LAM",
    "Eosinophilic pneumonia",
    "Others"
];
exports.OAD_SUBTYPES = [
    "Mild persistent asthma",
    "Moderate persistent asthma",
    "Severe persistent asthma",
    "Asthma-COPD Overlap (ACO)",
    "Others"
];
exports.COPD_SUBTYPES = [
    "Mild COPD",
    "Moderate COPD",
    "Severe COPD",
    "Very severe COPD",
    "Asthma-COPD Overlap (ACO)",
    "Others"
];
exports.BRONCHIECTASIS_SUBTYPES = [
    "Post-infectious",
    "Post tubercular",
    "Cystic Fibrosis related",
    "ABPA related",
    "Primary Ciliary Dyskinesia",
    "Idiopathic",
    "Others"
];
exports.POST_ICU_SUBTYPES = [
    "Asthma",
    "COPD",
    "ILD",
    "Bronchiectasis",
    "Post-infection recovery",
    "ARDS recovery",
    "Sepsis recovery",
    "COVID ICU recovery",
    "Post ventilation lung injury",
    "Post surgical ICU recovery",
    "Neuromuscular ICU recovery",
    "Others"
];
exports.CTD_TYPES = [
    "Scleroderma",
    "Rheumatoid arthritis",
    "SLE",
    "Dermatomyositis",
    "Polymyositis",
    "MCTD",
    "Others"
];
exports.SARCOIDOSIS_STAGES = [
    "Stage 1",
    "Stage 2",
    "Stage 3",
    "Stage 4"
];
exports.CO_MORBIDITIES_LIST = [
    "Diabetes Mellitus",
    "Hypertension",
    "Coronary Artery Disease",
    "Heart Failure",
    "Atrial Fibrillation",
    "GERD (Gastroesophageal Reflux Disease)",
    "Obstructive Sleep Apnea",
    "Chronic Kidney Disease",
    "Osteoporosis",
    "Depression/Anxiety",
    "Pulmonary Hypertension",
    "Venous Thromboembolism",
    "Past Pulmonary TB",
    "ABPA (Allergic Bronchopulmonary Aspergillosis)",
    "CCPA (Chronic Cavitary Pulmonary Aspergillosis)",
    "Allergic Rhinitis",
    "Hepatitis A",
    "Hepatitis B",
    "Hepatitis C",
    "HIV",
    "Cor Pulmonale",
    "Others"
];
exports.ROUTE_OPTIONS = [
    "Oral",
    "Intravenous",
    "Intramuscular",
    "Subcutaneous",
    "Inhalation",
    "Nebulization",
    "Topical",
    "Sublingual",
    "Rectal"
];
exports.FREQUENCY_LIST = [
    "Once daily (OD)",
    "Twice daily (BD)",
    "Three times daily (TDS)",
    "Four times daily (QDS)",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "As needed (PRN)",
    "Weekly",
    "Monthly",
    "Stat (Single dose)"
];
// Medication Drug Name Options
exports.DRUG_NAME_OPTIONS = [
    "Myxolone",
    "MMF (Mycophenolate Mofetil)",
    "Azathioprine",
    "Methotrexate",
    "Rituximab",
    "Nintedanib",
    "Pirfenidone",
    "Bronchodilator",
    "IVIG",
    "Other"
];
// PFT Normal Ranges
exports.PFT_RANGES = {
    FVC: { min: 80, max: 120, unit: "% predicted" },
    FEV1: { min: 80, max: 120, unit: "% predicted" },
    DLCO: { min: 80, max: 120, unit: "% predicted" },
    "6MWD": { min: 400, max: 700, unit: "meters" },
    "Min SpO2": { min: 88, max: 100, unit: "%" },
    "Max SpO2": { min: 95, max: 100, unit: "%" }
};
// Alert frequency options
exports.PERSONALIZED_ALERT_TYPES = [
    {
        type: 'pulmonary-rehabilitation',
        name: 'Pulmonary Rehabilitation',
        frequencies: ['1 time a day', '2 times a day']
    },
    {
        type: 'chest-physiotherapy',
        name: 'Chest Physiotherapy',
        frequencies: ['1 time', '2 times', '3 times', '4 times'],
        intervals: ['every 6 hours', 'every 4 hours']
    },
    {
        type: 'suctioning',
        name: 'Suctioning',
        frequencies: ['1 time', '2 times', '3 times', '4 times'],
        intervals: ['every 6 hours', 'every 4 hours']
    },
    {
        type: 'custom',
        name: 'Custom Alert',
        frequencies: ['1 time a day', '2 times a day', '3 times a day', '4 times a day'],
        intervals: ['every 6 hours', 'every 4 hours', 'every 8 hours', 'every 12 hours']
    }
];
//# sourceMappingURL=patient-types.js.map