import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type MenstrualCycleSettings = {
	periodDuration: number;
	cycleLength: number;
	lastPeriodStart: string | null;
	googleCalendarSynced?: boolean;
};

type MenstrualCycleStatus = {
	nextPeriodStart: Date | null;
	nextPeriodEnd: Date | null;
	daysUntil: number | null;
	countdownLabel: string;
	isDelayed: boolean;
};

type MenstrualCycleContextValue = {
	settings: MenstrualCycleSettings;
	status: MenstrualCycleStatus;
	updateSettings: (settings: Partial<MenstrualCycleSettings>) => void;
	syncToGoogleCalendar: () => string | null;
};

const DEFAULT_SETTINGS: MenstrualCycleSettings = {
	periodDuration: 5,
	cycleLength: 28,
	lastPeriodStart: null,
	googleCalendarSynced: false,
};

const STORAGE_KEY = "medilingo_menstrual_cycle";

const MenstrualCycleContext = createContext<MenstrualCycleContextValue | undefined>(undefined);

const formatForGoogleCalendar = (date: Date) => {
	const pad = (val: number) => val.toString().padStart(2, "0");
	return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
};

const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const MenstrualCycleProvider = ({ children }: { children: ReactNode }) => {
	const [settings, setSettings] = useState<MenstrualCycleSettings>(DEFAULT_SETTINGS);
	const [now, setNow] = useState<Date>(() => new Date());

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved) as MenstrualCycleSettings;
				setSettings({ ...DEFAULT_SETTINGS, ...parsed });
			} catch (err) {
				console.error("Failed to load menstrual cycle settings", err);
			}
		}
	}, []);

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 60 * 1000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	}, [settings]);

	const status = useMemo<MenstrualCycleStatus>(() => {
		if (!settings.lastPeriodStart) {
			return {
				nextPeriodStart: null,
				nextPeriodEnd: null,
				daysUntil: null,
				countdownLabel: "Add your cycle to start tracking",
				isDelayed: false,
			};
		}

		const baseStart = normalizeDate(new Date(settings.lastPeriodStart));
		const nextPeriodStart = new Date(baseStart.getTime() + settings.cycleLength * 24 * 60 * 60 * 1000);
		const nextPeriodEnd = new Date(nextPeriodStart.getTime() + settings.periodDuration * 24 * 60 * 60 * 1000);

		const today = normalizeDate(now);
		const diffMs = nextPeriodStart.getTime() - today.getTime();
		const daysUntil = Math.floor(diffMs / (24 * 60 * 60 * 1000));
		const isDelayed = daysUntil < 0;

		const daysAbsolute = Math.abs(daysUntil);
		const countdownLabel = (() => {
			if (daysUntil === 0) return "Starts today";
			if (daysUntil === 1) return "1 day left";
			if (daysUntil > 1) return `${daysUntil} days left`;
			if (daysUntil === -1) return "1 day delayed";
			return `${daysAbsolute} days delayed`;
		})();

		return {
			nextPeriodStart,
			nextPeriodEnd,
			daysUntil,
			countdownLabel,
			isDelayed,
		};
	}, [settings, now]);

	const updateSettings = (partial: Partial<MenstrualCycleSettings>) => {
		setSettings((prev) => {
			const merged: MenstrualCycleSettings = {
				...prev,
				...partial,
			};

			merged.periodDuration = Math.max(1, Math.min(merged.periodDuration || DEFAULT_SETTINGS.periodDuration, 14));
			merged.cycleLength = Math.max(15, Math.min(merged.cycleLength || DEFAULT_SETTINGS.cycleLength, 60));
			return merged;
		});
	};

	const syncToGoogleCalendar = () => {
		if (!status.nextPeriodStart || !status.nextPeriodEnd) return null;

		const start = formatForGoogleCalendar(status.nextPeriodStart);
		const end = formatForGoogleCalendar(status.nextPeriodEnd);

		const url =
			`https://calendar.google.com/calendar/render?action=TEMPLATE` +
			`&text=Menstrual%20Cycle%20(window)` +
			`&details=Predicted%20cycle%20window%20from%20MediLingo.%20` +
			`Period%20duration:%20${settings.periodDuration}%20days.%20Cycle%20length:%20${settings.cycleLength}%20days.` +
			`&dates=${start}/${end}` +
			`&recur=RRULE:FREQ=DAILY;INTERVAL=${settings.cycleLength}`;

		window.open(url, "_blank", "noopener,noreferrer");
		updateSettings({ googleCalendarSynced: true });
		return url;
	};

	return (
		<MenstrualCycleContext.Provider
			value={{ settings, status, updateSettings, syncToGoogleCalendar }}
		>
			{children}
		</MenstrualCycleContext.Provider>
	);
};

export const useMenstrualCycle = () => {
	const ctx = useContext(MenstrualCycleContext);
	if (!ctx) throw new Error("useMenstrualCycle must be used within MenstrualCycleProvider");
	return ctx;
};
