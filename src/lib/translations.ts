export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  nav: {
    appName: string;
  };
  hero: {
    trustBadge: string;
    title1: string;
    title2: string;
    title3: string;
    subtitle: string;
    scanButton: string;
    noAccount: string;
  };
  upload: {
    title: string;
    subtitle: string;
    dragDrop: string;
    or: string;
    takePhoto: string;
    chooseFile: string;
    supportedFormats: string;
    processing: string;
    success: string;
    cancel: string;
  };
  dashboard: {
    title: string;
    todaySchedule: string;
    dailyProgress: string;
    taken: string;
    of: string;
    morning: string;
    afternoon: string;
    night: string;
    markAsTaken: string;
    takenLabel: string;
    missedDose: string;
    listenInstructions: string;
    noMedicines: string;
  };
  common: {
    back: string;
    notifications: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      appName: 'MediLingo',
    },
    hero: {
      trustBadge: 'Trusted by 50,000+ families',
      title1: 'Understand Your',
      title2: 'Prescriptions',
      title3: 'In Seconds',
      subtitle: "Simply take a photo. We'll explain your medicines in plain, simple words.",
      scanButton: 'Scan Prescription',
      noAccount: 'No account needed • Free to use',
    },
    upload: {
      title: 'Upload Prescription',
      subtitle: 'Take a clear photo of your prescription',
      dragDrop: 'Drag and drop your image here',
      or: 'or',
      takePhoto: 'Take Photo',
      chooseFile: 'Choose from Gallery',
      supportedFormats: 'Supports JPG, PNG, PDF',
      processing: 'Reading your prescription...',
      success: 'Prescription Received',
      cancel: 'Cancel',
    },
    dashboard: {
      title: 'Your Medicines',
      todaySchedule: "Today's Schedule",
      dailyProgress: 'Daily Progress',
      taken: 'taken',
      of: 'of',
      morning: 'Morning',
      afternoon: 'Afternoon',
      night: 'Night',
      markAsTaken: 'Mark as Taken',
      takenLabel: 'Taken',
      missedDose: 'Missed Dose - Take Now',
      listenInstructions: 'Listen to instructions',
      noMedicines: 'No medicines scheduled',
    },
    common: {
      back: 'Go back',
      notifications: 'Notifications',
    },
  },
  hi: {
    nav: {
      appName: 'मेडीलिंगो',
    },
    hero: {
      trustBadge: '50,000+ परिवारों द्वारा विश्वसनीय',
      title1: 'अपनी दवाओं को',
      title2: 'समझें',
      title3: 'सेकंडों में',
      subtitle: 'बस एक फोटो लें। हम आपकी दवाइयों को सरल शब्दों में समझाएंगे।',
      scanButton: 'पर्चा स्कैन करें',
      noAccount: 'खाते की जरूरत नहीं • मुफ्त उपयोग',
    },
    upload: {
      title: 'पर्चा अपलोड करें',
      subtitle: 'अपने पर्चे की स्पष्ट तस्वीर लें',
      dragDrop: 'अपनी छवि यहाँ खींचें और छोड़ें',
      or: 'या',
      takePhoto: 'फोटो लें',
      chooseFile: 'गैलरी से चुनें',
      supportedFormats: 'JPG, PNG, PDF समर्थित',
      processing: 'आपका पर्चा पढ़ा जा रहा है...',
      success: 'पर्चा प्राप्त हुआ',
      cancel: 'रद्द करें',
    },
    dashboard: {
      title: 'आपकी दवाइयाँ',
      todaySchedule: 'आज का कार्यक्रम',
      dailyProgress: 'दैनिक प्रगति',
      taken: 'ली गई',
      of: 'में से',
      morning: 'सुबह',
      afternoon: 'दोपहर',
      night: 'रात',
      markAsTaken: 'ली गई के रूप में चिह्नित करें',
      takenLabel: 'ली गई',
      missedDose: 'खुराक छूट गई - अभी लें',
      listenInstructions: 'निर्देश सुनें',
      noMedicines: 'कोई दवाई निर्धारित नहीं',
    },
    common: {
      back: 'वापस जाएं',
      notifications: 'सूचनाएं',
    },
  },
  mr: {
    nav: {
      appName: 'मेडीलिंगो',
    },
    hero: {
      trustBadge: '50,000+ कुटुंबांचा विश्वास',
      title1: 'तुमची औषधे',
      title2: 'समजून घ्या',
      title3: 'काही सेकंदात',
      subtitle: 'फक्त एक फोटो घ्या. आम्ही तुमची औषधे सोप्या शब्दांत समजावून सांगू.',
      scanButton: 'प्रिस्क्रिप्शन स्कॅन करा',
      noAccount: 'खात्याची गरज नाही • मोफत वापर',
    },
    upload: {
      title: 'प्रिस्क्रिप्शन अपलोड करा',
      subtitle: 'तुमच्या प्रिस्क्रिप्शनचा स्पष्ट फोटो घ्या',
      dragDrop: 'तुमची प्रतिमा इथे ड्रॅग आणि ड्रॉप करा',
      or: 'किंवा',
      takePhoto: 'फोटो घ्या',
      chooseFile: 'गॅलरीतून निवडा',
      supportedFormats: 'JPG, PNG, PDF समर्थित',
      processing: 'तुमचे प्रिस्क्रिप्शन वाचत आहे...',
      success: 'प्रिस्क्रिप्शन प्राप्त झाले',
      cancel: 'रद्द करा',
    },
    dashboard: {
      title: 'तुमची औषधे',
      todaySchedule: 'आजचे वेळापत्रक',
      dailyProgress: 'दैनिक प्रगती',
      taken: 'घेतली',
      of: 'पैकी',
      morning: 'सकाळ',
      afternoon: 'दुपार',
      night: 'रात्र',
      markAsTaken: 'घेतले म्हणून नोंदवा',
      takenLabel: 'घेतले',
      missedDose: 'डोस चुकला - आता घ्या',
      listenInstructions: 'सूचना ऐका',
      noMedicines: 'कोणतीही औषधे नियोजित नाहीत',
    },
    common: {
      back: 'मागे जा',
      notifications: 'सूचना',
    },
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};
