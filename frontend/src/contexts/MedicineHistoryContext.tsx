import { FC, ReactNode, createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
}

export interface DoseRecord {
  id: string;
  medicineId: string;
  medicineName: string;
  doseTaken: number;
  doseUnit: string;
  timestamp: Date;
  notes?: string;
}

export interface MedicineHistoryEntry {
  id: string;
  prescriptionDate: Date;
  medicines: Medicine[];
  doseRecords: DoseRecord[];
  rawText?: string;
}

interface MedicineHistoryContextType {
  medicines: Medicine[];
  doseHistory: DoseRecord[];
  prescriptionHistory: MedicineHistoryEntry[];
  addMedicines: (medicines: Medicine[]) => void;
  recordDose: (medicineName: string, doseTaken: number, doseUnit: string, notes?: string) => void;
  getDoseCount: (medicineName: string) => number;
  savePrescriptionHistory: (entry: MedicineHistoryEntry) => void;
  clearHistory: () => void;
  getTodaysDoses: () => DoseRecord[];
  getMedicineHistory: (medicineName: string) => DoseRecord[];
}

const MedicineHistoryContext = createContext<MedicineHistoryContextType | undefined>(undefined);

export const MedicineHistoryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseHistory, setDoseHistory] = useState<DoseRecord[]>([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState<MedicineHistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('medilingo_dose_history');
    const savedMedicines = localStorage.getItem('medilingo_medicines');
    const savedPrescriptions = localStorage.getItem('medilingo_prescriptions');

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
        setDoseHistory(parsed);
      } catch (e) {
        console.error('Error loading dose history:', e);
      }
    }

    if (savedMedicines) {
      try {
        setMedicines(JSON.parse(savedMedicines));
      } catch (e) {
        console.error('Error loading medicines:', e);
      }
    }

    if (savedPrescriptions) {
      try {
        const parsed = JSON.parse(savedPrescriptions).map((entry: any) => ({
          ...entry,
          prescriptionDate: new Date(entry.prescriptionDate),
          doseRecords: entry.doseRecords.map((record: any) => ({
            ...record,
            timestamp: new Date(record.timestamp),
          })),
        }));
        setPrescriptionHistory(parsed);
      } catch (e) {
        console.error('Error loading prescription history:', e);
      }
    }
  }, []);

  const addMedicines = useCallback((newMedicines: Medicine[]) => {
    setMedicines(newMedicines);
    localStorage.setItem('medilingo_medicines', JSON.stringify(newMedicines));
  }, []);

  const recordDose = useCallback((medicineName: string, doseTaken: number, doseUnit: string, notes?: string) => {
    const doseRecord: DoseRecord = {
      id: `dose_${Date.now()}`,
      medicineId: medicines.find(m => m.name === medicineName)?.id || '',
      medicineName,
      doseTaken,
      doseUnit,
      timestamp: new Date(),
      notes,
    };
    
    const updated = [...doseHistory, doseRecord];
    setDoseHistory(updated);
    localStorage.setItem('medilingo_dose_history', JSON.stringify(updated));
  }, [doseHistory, medicines]);

  const getDoseCount = useCallback((medicineName: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return doseHistory.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return record.medicineName === medicineName && recordDate.getTime() === today.getTime();
    }).length;
  }, [doseHistory]);

  const getTodaysDoses = useCallback((): DoseRecord[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return doseHistory.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  }, [doseHistory]);

  const getMedicineHistory = useCallback((medicineName: string): DoseRecord[] => {
    return doseHistory.filter(record => record.medicineName === medicineName);
  }, [doseHistory]);

  const savePrescriptionHistory = useCallback((entry: MedicineHistoryEntry) => {
    const updated = [...prescriptionHistory, entry];
    setPrescriptionHistory(updated);
    localStorage.setItem('medilingo_prescriptions', JSON.stringify(updated));
  }, [prescriptionHistory]);

  const clearHistory = useCallback(() => {
    setMedicines([]);
    setDoseHistory([]);
    setPrescriptionHistory([]);
    localStorage.removeItem('medilingo_dose_history');
    localStorage.removeItem('medilingo_medicines');
    localStorage.removeItem('medilingo_prescriptions');
  }, []);

  return (
    <MedicineHistoryContext.Provider
      value={{
        medicines,
        doseHistory,
        prescriptionHistory,
        addMedicines,
        recordDose,
        getDoseCount,
        savePrescriptionHistory,
        clearHistory,
        getTodaysDoses,
        getMedicineHistory,
      }}
    >
      {children}
    </MedicineHistoryContext.Provider>
  );
};

export const useMedicineHistory = () => {
  const context = useContext(MedicineHistoryContext);
  if (!context) {
    throw new Error('useMedicineHistory must be used within MedicineHistoryProvider');
  }
  return context;
};
