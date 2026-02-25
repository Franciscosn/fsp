import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_PROGRESS_KEY = "fsp_heart_progress_v1";
const STORAGE_DAILY_KEY = "fsp_heart_daily_v1";
const STORAGE_DAILY_GOAL_KEY = "fsp_daily_goal_v1";
const STORAGE_XP_KEY = "fsp_xp_v1";
const STORAGE_VOICE_CASE_KEY = "fsp_voice_case_v1";
const STORAGE_VOICE_CASE_SELECTION_KEY = "fsp_voice_case_selection_v1";
const STORAGE_VOICE_MODE_KEY = "fsp_voice_mode_v1";
const STORAGE_VOICE_MODEL_KEY = "fsp_voice_model_v1";
const STORAGE_PROMPT_CONFIG_KEY = "fsp_prompt_config_v1";
const STORAGE_PROMPT_PROPOSAL_META_KEY = "fsp_prompt_proposal_meta_v1";
const STORAGE_API_SPEND_TRACKER_KEY = "fsp_api_spend_tracker_v1";
const DEFAULT_DAILY_GOAL = 20;
const MAX_DAILY_GOAL = 500;
const APP_STATE_CARD_ID = "__app_state__";
const APP_VERSION = "36";
const BUILD_UPDATED_AT = "2026-02-26 04:02 CET";
const MAX_VOICE_RECORD_MS = 25_000;
const MAX_VOICE_CASE_LENGTH = 8_000;
const MAX_VOICE_QUESTION_LENGTH = 500;
const MAX_DOCTOR_LETTER_LENGTH = 12_000;
const MAX_VOICE_HISTORY_TURNS = 60;
const MIN_VOICE_BLOB_BYTES = 450;
const MAX_PROMPT_TEXT_LENGTH = 60_000;
const MAX_PROMPT_PROPOSAL_NAME_LENGTH = 120;
const MAX_PROMPT_PROPOSAL_NOTE_LENGTH = 1_200;
const SUPABASE_REQUEST_TIMEOUT_MS = 15_000;
const PROMPT_API_TIMEOUT_MS = 20_000;
const PROMPT_PRESET_QUERY_LIMIT = 200;
const PROMPT_FEEDBACK_TARGET_ALL = "__all__";
const SUPABASE_PROMPT_FEEDBACK_TABLE = "prompt_feedback_submissions";
const SUPABASE_PROMPT_PROFILES_TABLE = "prompt_profiles";
const VOICE_CASE_LIBRARY_PATH = "data/patientengespraeche_ai_cases_de.txt";
const VOICE_CASE_RESOLUTION_PATH = "data/patientengespraeche_case_resolutions_de.json";
const VOICE_CASE_SAMPLE_PATH = "data/voice_case_samples_de.json";
const LEARNING_ANAMNESE_PATH = "data/learning_anamnese_de.json";
const VOICE_CASE_DEFAULT = "default";
const VOICE_CASE_CUSTOM = "custom";
const VOICE_CASE_LIBRARY_PREFIX = "lib:";
const VOICE_MODE_QUESTION = "question";
const VOICE_MODE_DIAGNOSIS = "diagnosis";
const VOICE_MODE_DOCTOR_CONVERSATION = "doctor_conversation";
const OPENAI_REALTIME_MODEL_FAST = "gpt-realtime-mini";
const OPENAI_REALTIME_MODEL_STRONG = "gpt-realtime";
const OPENAI_REALTIME_DEFAULT_VOICE = "sage";
const REALTIME_CONNECT_TIMEOUT_MS = 20_000;
const REALTIME_USE_DATA_CHANNEL = false;
const REALTIME_USE_UNIFIED_CONNECT = false;
const MAX_REALTIME_SDP_CANDIDATE_ATTEMPTS = 36;
const REALTIME_TRANSPORT_MODE = "websocket";
const REALTIME_AUDIO_CHUNK_BASE64_SIZE = 24_000;
const REALTIME_OUTPUT_SAMPLE_RATE = 24_000;
const OPENAI_REALTIME_PRICING_USD_PER_1M = Object.freeze({
  "gpt-realtime": Object.freeze({
    textInput: 4,
    textCachedInput: 0.4,
    textOutput: 16,
    audioInput: 32,
    audioCachedInput: 0.4,
    audioOutput: 64
  }),
  "gpt-realtime-mini": Object.freeze({
    textInput: 0.6,
    textCachedInput: 0.06,
    textOutput: 2.4,
    audioInput: 10,
    audioCachedInput: 0.3,
    audioOutput: 20
  })
});
const LEARNING_VIEW_ROOT = "root";
const LEARNING_VIEW_SUBCATEGORIES = "subcategories";
const LEARNING_VIEW_READING = "reading";
const LEARNING_VIEW_BODY = "body";
const LEARNING_ROOT_ITEMS = Object.freeze([
  {
    id: "anamnese",
    label: "Anamnese",
    cta: "Symptomkataloge oeffnen",
    view: LEARNING_VIEW_SUBCATEGORIES
  }
]);
const BODY_ATLAS_DEFAULT_REGION_ID = "thorax";
const BODY_ATLAS_MAP_IMAGE_SRC =
  "https://smart.servier.com/wp-content/uploads/2016/10/squelette_03.png";
const BODY_ATLAS_HITBOX_OVERRIDE_BY_ID = Object.freeze({
  kopf_gehirn: { left: 42, top: 2, width: 16, height: 12 },
  gesicht_hno: { left: 42, top: 9, width: 16, height: 9 },
  hals: { left: 45, top: 17, width: 10, height: 6 },
  thorax: { left: 38, top: 22, width: 24, height: 16 },
  herz_lunge: { left: 39, top: 24, width: 22, height: 17 },
  oberbauch: { left: 39, top: 39, width: 22, height: 10 },
  unterbauch_darm: { left: 39, top: 49, width: 22, height: 10 },
  becken_uro: { left: 39, top: 58, width: 22, height: 9 },
  ruecken_wirbelsaeule: { left: 48, top: 22, width: 6, height: 44 },
  linker_oberarm: {
    left: 28,
    top: 23,
    width: 11,
    height: 16,
    transform: "rotate(16deg)",
    originX: 34,
    originY: 31
  },
  rechter_oberarm: {
    left: 61,
    top: 23,
    width: 11,
    height: 16,
    transform: "rotate(-16deg)",
    originX: 66,
    originY: 31
  },
  linker_unterarm_hand: {
    left: 21,
    top: 37,
    width: 13,
    height: 24,
    transform: "rotate(8deg)",
    originX: 27,
    originY: 49
  },
  rechter_unterarm_hand: {
    left: 66,
    top: 37,
    width: 13,
    height: 24,
    transform: "rotate(-8deg)",
    originX: 72,
    originY: 49
  },
  linkes_bein: { left: 43, top: 67, width: 7, height: 29 },
  rechtes_bein: { left: 50, top: 67, width: 7, height: 29 }
});
const BODY_ATLAS_REGION_SOURCE_FIGURES_BY_ID = Object.freeze({
  kopf_gehirn: [
    {
      title: "Encephalon, sagittale Schnittdarstellung (nummeriert)",
      description: "Wikimedia Commons, nummerierte Hirnanatomie.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Encephalon_human_sagittal_section_multilingual.svg"
    }
  ],
  gesicht_hno: [
    {
      title: "Nasennebenhoehlen (nummeriert)",
      description: "Wikimedia Commons, koronal/sagittal nummeriert.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Paranasal_sinuses_numbers.svg"
    },
    {
      title: "Inneres Ohr (nummeriert)",
      description: "Wikimedia Commons, detaillierte HNO-Strukturen.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Anatomy_of_the_Human_Ear-Number.svg"
    }
  ],
  hals: [
    {
      title: "Artikulations- und Halsorgane (nummeriert)",
      description: "Wikimedia Commons, Mid-Sagittalschnitt.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Pronunciation_organs_diagram.png"
    },
    {
      title: "Vocal tract (nummeriert)",
      description: "Wikimedia Commons, Pharynx/Larynx-Orientierung.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/VocalTract_withNumbers.svg"
    }
  ],
  thorax: [
    {
      title: "Respiratorisches System komplett (nummeriert)",
      description: "Wikimedia Commons, Lungen- und Atemwegsstruktur.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Respiratory_system_complete_numbered.svg"
    }
  ],
  herz_lunge: [
    {
      title: "Herzquerschnitt (nummeriert)",
      description: "Wikimedia Commons, klassische Herznummerierung.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Heart_numlabels.svg"
    },
    {
      title: "Herzdiagramm (multilingual, nummeriert)",
      description: "Wikimedia Commons, ergänzende Herzanatomie.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Diagram_of_the_human_heart_(multilingual_2).svg"
    }
  ],
  oberbauch: [
    {
      title: "Magenanatomie (nummeriert)",
      description: "Wikimedia Commons, nummerierte Oberbauchfokussierung.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Anatomy_of_stomach_numbered.png"
    },
    {
      title: "Digestiver Apparat (nummeriert)",
      description: "Wikimedia Commons, obere Verdauungsorgane im Kontext.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Digestive_appareil_numbered.svg"
    }
  ],
  unterbauch_darm: [
    {
      title: "Verdauungssystem (nummeriert)",
      description: "Wikimedia Commons, Darmtrakt mit Nummern.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Digestive_system_diagram_numbered.svg"
    },
    {
      title: "GI-Trakt Schichten (nummeriert)",
      description: "Wikimedia Commons, vertiefte Darmstruktur.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Layers_of_the_GI_Tract_numbers.svg"
    }
  ],
  becken_uro: [
    {
      title: "Harnsystem (nummeriert)",
      description: "Wikimedia Commons, Urogenitalfokus mit Legende.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Urinary_system_ver_2.svg"
    },
    {
      title: "Niere (nummeriert)",
      description: "Wikimedia Commons, detaillierte renale Anatomie.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kidney-numbered.png"
    }
  ],
  ruecken_wirbelsaeule: [
    {
      title: "Wirbelsaeulenkruemmung (nummeriert)",
      description: "Wikimedia Commons, gesamte Wirbelsaeule mit Segmenten.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Spinal_column_curvature_numbered.svg"
    },
    {
      title: "Nervensystem (nummeriert)",
      description: "Wikimedia Commons, rueckenmarksnahe Orientierung.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Nervous_system_diagram_numbered.svg"
    }
  ],
  linker_oberarm: [
    {
      title: "Humerus und Ellenbogen",
      description: "Wikimedia Commons, anatomische Detailtafel.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/804_Humerus_and_Elbow.jpg"
    },
    {
      title: "Armknochen-Diagramm",
      description: "Wikimedia Commons, uebersichtliche Armknochenstruktur.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Human_arm_bones_diagram.svg"
    }
  ],
  rechter_oberarm: [
    {
      title: "Humerus und Ellenbogen",
      description: "Wikimedia Commons, anatomische Detailtafel.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/804_Humerus_and_Elbow.jpg"
    },
    {
      title: "Armknochen-Diagramm",
      description: "Wikimedia Commons, uebersichtliche Armknochenstruktur.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Human_arm_bones_diagram.svg"
    }
  ],
  linker_unterarm_hand: [
    {
      title: "Handknochen (nummeriert)",
      description: "Wikimedia Commons, knoecherne Strukturen der Hand.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Hand_bones_numbered.png"
    },
    {
      title: "Palmarer Tiefenschnitt (nummeriert)",
      description: "Wikimedia Commons, Sehnen/Gefaesse/Nerven.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Wrist_and_hand_deeper_palmar_dissection-numbers.svg"
    }
  ],
  rechter_unterarm_hand: [
    {
      title: "Handknochen (nummeriert)",
      description: "Wikimedia Commons, knoecherne Strukturen der Hand.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Hand_bones_numbered.png"
    },
    {
      title: "Palmarer Tiefenschnitt (nummeriert)",
      description: "Wikimedia Commons, Sehnen/Gefaesse/Nerven.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Wrist_and_hand_deeper_palmar_dissection-numbers.svg"
    }
  ],
  linkes_bein: [
    {
      title: "Knieanatomie (nummeriert)",
      description: "Wikimedia Commons, Band- und Gelenkstrukturen.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Knee_diagram_numbered.png"
    },
    {
      title: "Oberschenkelarterien (nummeriert)",
      description: "Wikimedia Commons, Gefaessverlauf im Bein.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Thigh_arteries_schema_numbered.svg"
    }
  ],
  rechtes_bein: [
    {
      title: "Knieanatomie (nummeriert)",
      description: "Wikimedia Commons, Band- und Gelenkstrukturen.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Knee_diagram_numbered.png"
    },
    {
      title: "Oberschenkelarterien (nummeriert)",
      description: "Wikimedia Commons, Gefaessverlauf im Bein.",
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Thigh_arteries_schema_numbered.svg"
    }
  ]
});
const BODY_ATLAS_EXTRA_TERMS_BY_GROUP = Object.freeze({
  head: [
    { fach: "Lobus occipitalis", patient: "Hinterhauptlappen", info: "Verarbeitet Sehreize.", x: 126, y: 98 },
    { fach: "Thalamus", patient: "Umschaltzentrum im Gehirn", info: "Filtert sensorische Signale.", x: 158, y: 132 },
    { fach: "Hypothalamus", patient: "Regelzentrum fuer Hormone", info: "Steuert Temperatur und Hunger.", x: 168, y: 148 },
    { fach: "Truncus encephali", patient: "Hirnstamm", info: "Kontrolliert lebenswichtige Grundfunktionen.", x: 170, y: 172 },
    { fach: "Ventriculus lateralis", patient: "Hirnkammer", info: "Liquorraum im Gehirn.", x: 196, y: 114 }
  ],
  hno: [
    { fach: "Sinus frontalis", patient: "Stirnhoehle", info: "Nebenhoehle im Stirnbereich.", x: 160, y: 84 },
    { fach: "Septum nasi", patient: "Nasenscheidewand", info: "Trennt rechte und linke Nasenseite.", x: 162, y: 132 },
    { fach: "Concha nasalis", patient: "Nasenmuschel", info: "Erwaermt und befeuchtet Luft.", x: 145, y: 124 },
    { fach: "Epiglottis", patient: "Kehldeckel", info: "Schuetzt die Atemwege beim Schlucken.", x: 164, y: 186 },
    { fach: "Larynx", patient: "Kehlkopf", info: "Enthaelt die Stimmbildung.", x: 170, y: 198 }
  ],
  thorax: [
    { fach: "Clavicula", patient: "Schluesselbein", info: "Verbindet Brustbein und Schulter.", x: 111, y: 72 },
    { fach: "Bronchus principalis", patient: "Hauptbronchie", info: "Leitet Luft in die Lungenfluegel.", x: 164, y: 112 },
    { fach: "Pleura visceralis", patient: "Lungenfell", info: "Liegt direkt auf der Lunge.", x: 226, y: 156 },
    { fach: "Mediastinum", patient: "Mittelfellraum", info: "Raum zwischen den Lungen.", x: 162, y: 152 },
    { fach: "Arcus costalis", patient: "Rippenbogen", info: "Untere Rippenkante des Brustkorbs.", x: 166, y: 214 }
  ],
  cardio: [
    { fach: "Atrium dextrum", patient: "rechter Vorhof", info: "Nimmt venoeses Blut auf.", x: 146, y: 136 },
    { fach: "Ventriculus sinister", patient: "linke Herzkammer", info: "Pumpt Blut in den Koerperkreislauf.", x: 172, y: 182 },
    { fach: "Valva mitralis", patient: "Mitralklappe", info: "Klappe zwischen linkem Vorhof und Kammer.", x: 160, y: 156 },
    { fach: "Vena cava superior", patient: "obere Hohlvene", info: "Fuehrt Blut zum Herzen.", x: 142, y: 90 },
    { fach: "Vena pulmonalis", patient: "Lungenvene", info: "Bringt oxygeniertes Blut zum Herzen.", x: 194, y: 124 }
  ],
  upper_abdomen: [
    { fach: "Duodenum", patient: "Zwoelffingerdarm", info: "Erster Abschnitt des Duenndarms.", x: 172, y: 170 },
    { fach: "Cardia", patient: "Mageneingang", info: "Uebergang Speiseroehre-Magen.", x: 208, y: 92 },
    { fach: "Lobus hepatis dexter", patient: "rechter Leberlappen", info: "Groesster Leberanteil.", x: 108, y: 96 },
    { fach: "Lobus hepatis sinister", patient: "linker Leberlappen", info: "Leberanteil zur Mitte hin.", x: 140, y: 102 },
    { fach: "Ductus choledochus", patient: "Gallengang", info: "Fuehrt Galle in den Darm.", x: 146, y: 152 }
  ],
  lower_abdomen: [
    { fach: "Caecum", patient: "Blinddarmabschnitt", info: "Anfang des Dickdarms.", x: 114, y: 150 },
    { fach: "Ileocaecalklappe", patient: "Darmklappe", info: "Grenze zwischen Duenn- und Dickdarm.", x: 130, y: 144 },
    { fach: "Colon sigmoideum", patient: "Sigma", info: "S-foermiger Dickdarmabschnitt.", x: 188, y: 166 },
    { fach: "Jejunum", patient: "Leerdarm", info: "Mittlerer Duenndarmabschnitt.", x: 158, y: 136 },
    { fach: "Canalis analis", patient: "Analkanal", info: "Letzter Abschnitt vor dem After.", x: 170, y: 228 }
  ],
  pelvis: [
    { fach: "Ren sinister", patient: "linke Niere", info: "Filtert Blut und bildet Urin.", x: 122, y: 76 },
    { fach: "Ren dexter", patient: "rechte Niere", info: "Filtert Blut und bildet Urin.", x: 206, y: 76 },
    { fach: "Uterus", patient: "Gebaermutter", info: "Zentrales Organ des weiblichen Beckens.", x: 162, y: 136 },
    { fach: "Prostata", patient: "Vorsteherdruese", info: "Liegt unterhalb der Blase beim Mann.", x: 166, y: 186 },
    { fach: "Pelvis ossea", patient: "Beckenknochen", info: "Traegt die Beckenorgane.", x: 238, y: 172 }
  ],
  spine: [
    { fach: "Discus intervertebralis", patient: "Bandscheibe", info: "Puffer zwischen den Wirbeln.", x: 160, y: 150 },
    { fach: "Medulla spinalis", patient: "Rueckenmark", info: "Nervenleitung vom Gehirn in den Koerper.", x: 160, y: 130 },
    { fach: "Sacrum", patient: "Kreuzbein", info: "Teil des hinteren Beckens.", x: 160, y: 212 },
    { fach: "Coccyx", patient: "Steissbein", info: "Unterstes Ende der Wirbelsaeule.", x: 160, y: 236 },
    { fach: "Foramen intervertebrale", patient: "Nervenaustrittsloch", info: "Austrittsstelle der Spinalnerven.", x: 188, y: 162 }
  ],
  upper_arm: [
    { fach: "Caput humeri", patient: "Oberarmkopf", info: "Teil des Schultergelenks.", x: 150, y: 62 },
    { fach: "Arteria brachialis", patient: "Oberarmarterie", info: "Wichtige Gefaessversorgung im Arm.", x: 170, y: 132 },
    { fach: "Nervus ulnaris", patient: "Ellennerv", info: "Verlaeuft zur Kleinfingerseite.", x: 138, y: 166 },
    { fach: "Musculus brachialis", patient: "tiefer Beugemuskel", info: "Unterstuetzt Ellenbogenbeugung.", x: 174, y: 146 },
    { fach: "Olecranon", patient: "Ellenbogenspitze", info: "Knoecherner Ellenbogenfortsatz.", x: 158, y: 198 }
  ],
  forearm_hand: [
    { fach: "Articulatio radiocarpalis", patient: "Handgelenk", info: "Verbindet Unterarm und Hand.", x: 164, y: 144 },
    { fach: "Metacarpalia", patient: "Mittelhandknochen", info: "Knochen zwischen Handwurzel und Fingern.", x: 170, y: 188 },
    { fach: "Phalanges", patient: "Fingerknochen", info: "Knochen der Finger.", x: 186, y: 224 },
    { fach: "Nervus ulnaris", patient: "Ellennerv in der Hand", info: "Versorgt Ring- und Kleinfingerbereich.", x: 136, y: 198 },
    { fach: "Retinaculum flexorum", patient: "Beugesehnenband", info: "Stabilisiert Sehnen am Handgelenk.", x: 158, y: 162 }
  ],
  leg: [
    { fach: "Articulatio coxae", patient: "Hueftgelenk", info: "Verbindung Becken-Oberschenkel.", x: 160, y: 52 },
    { fach: "Trochanter major", patient: "grosser Rollhuegel", info: "Knochenvorsprung am Femur.", x: 148, y: 82 },
    { fach: "Patella", patient: "Kniescheibe", info: "Schuetzt die Vorderseite des Knies.", x: 160, y: 138 },
    { fach: "Malleolus medialis", patient: "Innenknochel", info: "Innerer Sprunggelenkfortsatz.", x: 150, y: 236 },
    { fach: "Malleolus lateralis", patient: "Aussenknochel", info: "Aeusserer Sprunggelenkfortsatz.", x: 182, y: 236 }
  ],
  general: []
});
const BODY_ATLAS_REGIONS = Object.freeze([
  {
    id: "kopf_gehirn",
    label: "Kopf und Gehirn",
    hint: "Zentrale neurologische Strukturen",
    map: { type: "ellipse", cx: 160, cy: 58, rx: 31, ry: 31 },
    zoomType: "head",
    hotspots: [
      {
        x: 160,
        y: 70,
        fach: "Lobus frontalis",
        patient: "Stirnhirn",
        info: "Wichtig fuer Planung, Aufmerksamkeit und Verhalten."
      },
      {
        x: 210,
        y: 122,
        fach: "Lobus temporalis",
        patient: "Schlaefenhirn",
        info: "Beteiligt an Sprachverstehen und Hoehrverarbeitung."
      },
      {
        x: 157,
        y: 190,
        fach: "Cerebellum",
        patient: "Kleinhirn",
        info: "Koordiniert Bewegungen und Gleichgewicht."
      },
      {
        x: 118,
        y: 138,
        fach: "Lobus parietalis",
        patient: "Scheitelbereich des Gehirns",
        info: "Verarbeitet Beruehrung, Lageempfinden und Raumorientierung."
      },
      {
        x: 162,
        y: 146,
        fach: "Hypophyse",
        patient: "Hirnanhangsdruese",
        info: "Steuert mehrere Hormonsysteme."
      }
    ]
  },
  {
    id: "gesicht_hno",
    label: "Gesicht und HNO",
    hint: "Augen, Nase, Nebenhoehlen, Rachen",
    map: { type: "ellipse", cx: 160, cy: 91, rx: 24, ry: 20 },
    zoomType: "face",
    hotspots: [
      {
        x: 118,
        y: 108,
        fach: "Orbita",
        patient: "Augenhoehle",
        info: "Knoecherner Raum fuer Auge und Augenmuskeln."
      },
      {
        x: 205,
        y: 110,
        fach: "Sinus maxillaris",
        patient: "Kieferhoehle",
        info: "Nebenhoehle, haeufiger Ort bei Sinusitis."
      },
      {
        x: 161,
        y: 132,
        fach: "Cavitas nasi",
        patient: "Nasenhoehle",
        info: "Erwaermt, reinigt und befeuchtet Atemluft."
      },
      {
        x: 164,
        y: 171,
        fach: "Pharynx",
        patient: "Rachen",
        info: "Gemeinsamer Abschnitt fuer Luft- und Speiseweg."
      },
      {
        x: 159,
        y: 206,
        fach: "Tonsilla palatina",
        patient: "Gaumenmandel",
        info: "Teil der lokalen Immunabwehr im Rachen."
      }
    ]
  },
  {
    id: "hals",
    label: "Hals",
    hint: "Atemweg, Speiseweg, Gefaesse und Schilddruese",
    map: { type: "rect", x: 142, y: 104, width: 36, height: 36, rx: 12, ry: 12 },
    zoomType: "neck",
    hotspots: [
      {
        x: 160,
        y: 86,
        fach: "Glandula thyroidea",
        patient: "Schilddruese",
        info: "Reguliert den Stoffwechsel ueber Schilddruesenhormone."
      },
      {
        x: 160,
        y: 133,
        fach: "Trachea",
        patient: "Luftroehre",
        info: "Leitet Luft in die Bronchien."
      },
      {
        x: 198,
        y: 138,
        fach: "Oesophagus",
        patient: "Speiseroehre",
        info: "Transportiert Nahrung in den Magen."
      },
      {
        x: 122,
        y: 130,
        fach: "Arteria carotis communis",
        patient: "Halsschlagader",
        info: "Wichtige Blutversorgung fuer Kopf und Gehirn."
      },
      {
        x: 104,
        y: 98,
        fach: "Nodi lymphatici cervicales",
        patient: "Halslymphknoten",
        info: "Koennen bei Infekten anschwellen."
      }
    ]
  },
  {
    id: "thorax",
    label: "Thoraxwand",
    hint: "Brustkorb, Rippen, Pleura, Atemmechanik",
    map: { type: "rect", x: 122, y: 142, width: 76, height: 98, rx: 26, ry: 26 },
    zoomType: "chest",
    hotspots: [
      {
        x: 160,
        y: 82,
        fach: "Sternum",
        patient: "Brustbein",
        info: "Vordere knoecherne Struktur des Brustkorbs."
      },
      {
        x: 97,
        y: 126,
        fach: "Costae",
        patient: "Rippen",
        info: "Schuetzen Herz und Lunge."
      },
      {
        x: 230,
        y: 146,
        fach: "Musculi intercostales",
        patient: "Zwischenrippenmuskeln",
        info: "Unterstuetzen die Atembewegung."
      },
      {
        x: 199,
        y: 180,
        fach: "Pleura parietalis",
        patient: "Brustfell",
        info: "Auskleidung der Brusthoehle."
      },
      {
        x: 162,
        y: 236,
        fach: "Diaphragma",
        patient: "Zwerchfell",
        info: "Wichtigster Atemmuskel."
      }
    ]
  },
  {
    id: "herz_lunge",
    label: "Herz und Lunge",
    hint: "Kardio-pulmonaler Kernbereich",
    map: { type: "ellipse", cx: 160, cy: 189, rx: 41, ry: 49 },
    zoomType: "cardio",
    hotspots: [
      {
        x: 168,
        y: 150,
        fach: "Cor",
        patient: "Herz",
        info: "Pumpt Blut durch den gesamten Kreislauf."
      },
      {
        x: 96,
        y: 136,
        fach: "Pulmo dexter",
        patient: "rechte Lunge",
        info: "Drei Lappen, rechts im Brustkorb."
      },
      {
        x: 233,
        y: 136,
        fach: "Pulmo sinister",
        patient: "linke Lunge",
        info: "Zwei Lappen, grenzt ans Herz."
      },
      {
        x: 161,
        y: 100,
        fach: "Aorta",
        patient: "Hauptschlagader",
        info: "Groesste Arterie aus dem linken Herzen."
      },
      {
        x: 155,
        y: 74,
        fach: "Truncus pulmonalis",
        patient: "Lungenschlagader",
        info: "Fuehrt Blut vom Herzen zur Lunge."
      }
    ]
  },
  {
    id: "oberbauch",
    label: "Oberbauchorgane",
    hint: "Leber, Magen, Pankreas, Milz",
    map: { type: "rect", x: 126, y: 248, width: 68, height: 65, rx: 20, ry: 20 },
    zoomType: "upper_abdomen",
    hotspots: [
      {
        x: 111,
        y: 108,
        fach: "Hepar",
        patient: "Leber",
        info: "Zentrales Stoffwechsel- und Entgiftungsorgan."
      },
      {
        x: 206,
        y: 118,
        fach: "Ventriculus",
        patient: "Magen",
        info: "Erster grosser Verdauungsabschnitt."
      },
      {
        x: 166,
        y: 155,
        fach: "Pancreas",
        patient: "Bauchspeicheldruese",
        info: "Bildet Verdauungsenzyme und Insulin."
      },
      {
        x: 233,
        y: 137,
        fach: "Lien",
        patient: "Milz",
        info: "Teil des Immunsystems."
      },
      {
        x: 124,
        y: 145,
        fach: "Vesica biliaris",
        patient: "Gallenblase",
        info: "Speichert Gallensekret."
      }
    ]
  },
  {
    id: "unterbauch_darm",
    label: "Unterbauch und Darm",
    hint: "Duenndarm, Dickdarm, Appendix, Rektum",
    map: { type: "rect", x: 126, y: 318, width: 68, height: 60, rx: 19, ry: 19 },
    zoomType: "lower_abdomen",
    hotspots: [
      {
        x: 151,
        y: 112,
        fach: "Intestinum tenue",
        patient: "Duenndarm",
        info: "Hauptort der Naehrstoffaufnahme."
      },
      {
        x: 100,
        y: 116,
        fach: "Colon ascendens",
        patient: "aufsteigender Dickdarm",
        info: "Transportiert Darminhalt nach oben."
      },
      {
        x: 225,
        y: 119,
        fach: "Colon descendens",
        patient: "absteigender Dickdarm",
        info: "Transportiert Darminhalt nach unten."
      },
      {
        x: 121,
        y: 176,
        fach: "Appendix vermiformis",
        patient: "Wurmfortsatz",
        info: "Entzuendet sich bei Appendizitis."
      },
      {
        x: 168,
        y: 205,
        fach: "Rectum",
        patient: "Enddarm",
        info: "Speichert Stuhl vor der Entleerung."
      }
    ]
  },
  {
    id: "becken_uro",
    label: "Becken und Urogenital",
    hint: "Harnwege und Reproduktionsorgane",
    map: { type: "rect", x: 124, y: 385, width: 72, height: 56, rx: 18, ry: 18 },
    zoomType: "pelvis",
    hotspots: [
      {
        x: 160,
        y: 156,
        fach: "Vesica urinaria",
        patient: "Harnblase",
        info: "Speichert Urin bis zur Miktion."
      },
      {
        x: 116,
        y: 114,
        fach: "Ureter sinister",
        patient: "linker Harnleiter",
        info: "Leitet Urin von der Niere zur Blase."
      },
      {
        x: 206,
        y: 114,
        fach: "Ureter dexter",
        patient: "rechter Harnleiter",
        info: "Leitet Urin von der Niere zur Blase."
      },
      {
        x: 161,
        y: 206,
        fach: "Urethra",
        patient: "Harnroehre",
        info: "Ausfuehrgang der Blase."
      },
      {
        x: 160,
        y: 116,
        fach: "Organa genitalia interna",
        patient: "innere Geschlechtsorgane",
        info: "Je nach Geschlecht z. B. Uterus/Ovarien oder Prostata."
      }
    ]
  },
  {
    id: "ruecken_wirbelsaeule",
    label: "Ruecken und Wirbelsaeule",
    hint: "Wirbelsaeule, Spinalkanal, ISG",
    map: { type: "rect", x: 228, y: 184, width: 20, height: 214, rx: 10, ry: 10 },
    zoomType: "spine",
    hotspots: [
      {
        x: 160,
        y: 72,
        fach: "Columna cervicalis",
        patient: "Halswirbelsaeule",
        info: "Beweglicher oberer Wirbelsaeulenabschnitt."
      },
      {
        x: 160,
        y: 122,
        fach: "Columna thoracica",
        patient: "Brustwirbelsaeule",
        info: "Abschnitt mit Rippenanbindung."
      },
      {
        x: 160,
        y: 177,
        fach: "Columna lumbalis",
        patient: "Lendenwirbelsaeule",
        info: "Haeufiger Ort fuer Rueckenschmerz."
      },
      {
        x: 160,
        y: 134,
        fach: "Canalis vertebralis",
        patient: "Wirbelkanal",
        info: "Enthaelt das Rueckenmark."
      },
      {
        x: 160,
        y: 226,
        fach: "Articulatio sacroiliaca",
        patient: "Iliosakralgelenk",
        info: "Verbindung zwischen Becken und Kreuzbein."
      }
    ]
  },
  {
    id: "linker_oberarm",
    label: "Linker Oberarm",
    hint: "Schulter bis Ellenbogen links",
    map: {
      type: "rect",
      x: 93,
      y: 156,
      width: 28,
      height: 100,
      rx: 12,
      ry: 12,
      transform: "rotate(18 107 205)"
    },
    zoomType: "upper_arm_left",
    hotspots: [
      {
        x: 156,
        y: 80,
        fach: "Humerus",
        patient: "Oberarmknochen",
        info: "Knochen zwischen Schulter und Ellenbogen."
      },
      {
        x: 127,
        y: 118,
        fach: "Musculus deltoideus",
        patient: "Schultermuskel",
        info: "Wichtig fuer Armheben und Stabilitaet."
      },
      {
        x: 180,
        y: 118,
        fach: "Musculus biceps brachii",
        patient: "vorderer Oberarmmuskel",
        info: "Beugt den Ellenbogen."
      },
      {
        x: 144,
        y: 164,
        fach: "Musculus triceps brachii",
        patient: "hinterer Oberarmmuskel",
        info: "Streckt den Ellenbogen."
      },
      {
        x: 182,
        y: 170,
        fach: "Nervus radialis",
        patient: "wichtiger Armnerv",
        info: "Relevant bei Sensibilitaets- und Kraftausfaellen."
      }
    ]
  },
  {
    id: "rechter_oberarm",
    label: "Rechter Oberarm",
    hint: "Schulter bis Ellenbogen rechts",
    map: {
      type: "rect",
      x: 199,
      y: 156,
      width: 28,
      height: 100,
      rx: 12,
      ry: 12,
      transform: "rotate(-18 213 205)"
    },
    zoomType: "upper_arm_right",
    hotspots: [
      {
        x: 164,
        y: 80,
        fach: "Humerus",
        patient: "Oberarmknochen",
        info: "Knochen zwischen Schulter und Ellenbogen."
      },
      {
        x: 196,
        y: 118,
        fach: "Musculus deltoideus",
        patient: "Schultermuskel",
        info: "Wichtig fuer Armheben und Stabilitaet."
      },
      {
        x: 140,
        y: 118,
        fach: "Musculus biceps brachii",
        patient: "vorderer Oberarmmuskel",
        info: "Beugt den Ellenbogen."
      },
      {
        x: 178,
        y: 164,
        fach: "Musculus triceps brachii",
        patient: "hinterer Oberarmmuskel",
        info: "Streckt den Ellenbogen."
      },
      {
        x: 138,
        y: 170,
        fach: "Nervus radialis",
        patient: "wichtiger Armnerv",
        info: "Relevant bei Sensibilitaets- und Kraftausfaellen."
      }
    ]
  },
  {
    id: "linker_unterarm_hand",
    label: "Linker Unterarm und Hand",
    hint: "Ellenbogen bis Finger links",
    map: {
      type: "rect",
      x: 62,
      y: 262,
      width: 30,
      height: 132,
      rx: 14,
      ry: 14,
      transform: "rotate(10 77 328)"
    },
    zoomType: "forearm_left",
    hotspots: [
      {
        x: 134,
        y: 82,
        fach: "Radius",
        patient: "Speiche",
        info: "Unterarmknochen auf Daumenseite."
      },
      {
        x: 186,
        y: 94,
        fach: "Ulna",
        patient: "Elle",
        info: "Unterarmknochen auf Kleinfingerseite."
      },
      {
        x: 164,
        y: 150,
        fach: "Ossa carpi",
        patient: "Handwurzelknochen",
        info: "Mehrere kleine Knochen am Handgelenk."
      },
      {
        x: 136,
        y: 177,
        fach: "Nervus medianus",
        patient: "Mittelhandnerv",
        info: "Relevant beim Karpaltunnelsyndrom."
      },
      {
        x: 199,
        y: 177,
        fach: "Arteria radialis",
        patient: "Pulsarterie",
        info: "Hier tastet man haeufig den Puls."
      }
    ]
  },
  {
    id: "rechter_unterarm_hand",
    label: "Rechter Unterarm und Hand",
    hint: "Ellenbogen bis Finger rechts",
    map: {
      type: "rect",
      x: 228,
      y: 262,
      width: 30,
      height: 132,
      rx: 14,
      ry: 14,
      transform: "rotate(-10 243 328)"
    },
    zoomType: "forearm_right",
    hotspots: [
      {
        x: 186,
        y: 82,
        fach: "Radius",
        patient: "Speiche",
        info: "Unterarmknochen auf Daumenseite."
      },
      {
        x: 134,
        y: 94,
        fach: "Ulna",
        patient: "Elle",
        info: "Unterarmknochen auf Kleinfingerseite."
      },
      {
        x: 156,
        y: 150,
        fach: "Ossa carpi",
        patient: "Handwurzelknochen",
        info: "Mehrere kleine Knochen am Handgelenk."
      },
      {
        x: 184,
        y: 177,
        fach: "Nervus medianus",
        patient: "Mittelhandnerv",
        info: "Relevant beim Karpaltunnelsyndrom."
      },
      {
        x: 121,
        y: 177,
        fach: "Arteria radialis",
        patient: "Pulsarterie",
        info: "Hier tastet man haeufig den Puls."
      }
    ]
  },
  {
    id: "linkes_bein",
    label: "Linkes Bein",
    hint: "Huefte, Knie, Unterschenkel links",
    map: { type: "rect", x: 130, y: 444, width: 30, height: 165, rx: 14, ry: 14 },
    zoomType: "leg_left",
    hotspots: [
      {
        x: 154,
        y: 72,
        fach: "Femur",
        patient: "Oberschenkelknochen",
        info: "Laengster Knochen des Koerpers."
      },
      {
        x: 158,
        y: 130,
        fach: "Articulatio genus",
        patient: "Kniegelenk",
        info: "Verbindet Ober- und Unterschenkel."
      },
      {
        x: 146,
        y: 186,
        fach: "Tibia",
        patient: "Schienbein",
        info: "Traegt einen grossen Teil der Last."
      },
      {
        x: 188,
        y: 186,
        fach: "Fibula",
        patient: "Wadenbein",
        info: "Stabilisiert den Unterschenkel seitlich."
      },
      {
        x: 162,
        y: 232,
        fach: "Tendo calcaneus",
        patient: "Achillessehne",
        info: "Kraeftige Sehne zwischen Wade und Ferse."
      }
    ]
  },
  {
    id: "rechtes_bein",
    label: "Rechtes Bein",
    hint: "Huefte, Knie, Unterschenkel rechts",
    map: { type: "rect", x: 162, y: 444, width: 30, height: 165, rx: 14, ry: 14 },
    zoomType: "leg_right",
    hotspots: [
      {
        x: 166,
        y: 72,
        fach: "Femur",
        patient: "Oberschenkelknochen",
        info: "Laengster Knochen des Koerpers."
      },
      {
        x: 162,
        y: 130,
        fach: "Articulatio genus",
        patient: "Kniegelenk",
        info: "Verbindet Ober- und Unterschenkel."
      },
      {
        x: 174,
        y: 186,
        fach: "Tibia",
        patient: "Schienbein",
        info: "Traegt einen grossen Teil der Last."
      },
      {
        x: 132,
        y: 186,
        fach: "Fibula",
        patient: "Wadenbein",
        info: "Stabilisiert den Unterschenkel seitlich."
      },
      {
        x: 158,
        y: 232,
        fach: "Tendo calcaneus",
        patient: "Achillessehne",
        info: "Kraeftige Sehne zwischen Wade und Ferse."
      }
    ]
  }
]);
const BODY_ATLAS_REGION_BY_ID = Object.freeze(
  BODY_ATLAS_REGIONS.reduce((acc, entry, index) => {
    acc[entry.id] = { ...entry, order: index + 1 };
    return acc;
  }, {})
);
const VOICE_SAMPLE_VIEW_PATIENT = "sample_patient";
const VOICE_SAMPLE_VIEW_LETTER = "sample_letter";
const VOICE_SAMPLE_VIEW_DOCTOR = "sample_doctor";
const VOICE_SAMPLE_VIEW_MAP = Object.freeze({
  [VOICE_SAMPLE_VIEW_PATIENT]: {
    title: "Muster Arzt-Patient Gespraech",
    field: "muster_arzt_patient_gespraech",
    buttonRef: "voiceSamplePatientBtn"
  },
  [VOICE_SAMPLE_VIEW_LETTER]: {
    title: "Muster Arztbrief",
    field: "muster_arztbrief",
    buttonRef: "voiceSampleLetterBtn"
  },
  [VOICE_SAMPLE_VIEW_DOCTOR]: {
    title: "Muster Arzt-Arzt Gespraech",
    field: "muster_arzt_arzt_gespraech",
    buttonRef: "voiceSampleDoctorBtn"
  }
});
const DEFAULT_VOICE_CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const VOICE_MODEL_OPTIONS = [
  { value: "@cf/openai/gpt-oss-20b", label: "gpt-oss-20b (empfohlen)" },
  { value: "@cf/qwen/qwen3-30b-a3b-fp8", label: "qwen3-30b-a3b-fp8 (guenstig)" },
  { value: "@cf/zai-org/glm-4.7-flash", label: "glm-4.7-flash (schnell)" },
  { value: "@cf/openai/gpt-oss-120b", label: "gpt-oss-120b (staerker, teurer)" }
];
const VOICE_MODEL_SET = new Set(VOICE_MODEL_OPTIONS.map((entry) => entry.value));
const DOCTOR_EVAL_REQUIRED_PROMPT_BLOCK = [
  "Zusaetzlich ist ein ausfuehrlicher, aussagekraeftiger Fliesstext Pflicht (detailed_feedback_text): 120-220 Woerter, konkret, fehlerbezogen und individuell.",
  "Der Fliesstext muss klar benennen:",
  "- welche sprachlichen/kommunikativen Fehler aufgetreten sind,",
  "- wie sich diese Fehler im Gespraech gezeigt haben,",
  "- wie die Aussagen sprachlich besser formuliert werden koennen,",
  "- welche 2-3 priorisierten Trainingsschritte als Naechstes sinnvoll sind.",
  "Keine allgemeinen Floskeln, keine reinen Standardsaetze, kein Copy-Paste der Kriterienliste.",
  "JSON-Felder: criteria, total_score, pass_assessment, recommendation, summary_feedback, detailed_feedback_text."
].join("\n");
const DEFAULT_PROMPT_CONFIG = Object.freeze({
  voiceTurn: [
    "Rolle: Du bist ausschliesslich ein standardisierter Patient in einer medizinischen Fachsprachpruefung.",
    "Sprache: Alle Ausgaben muessen auf Deutsch sein. Kein Englisch.",
    "Perspektive: Antworte in Ich-Form aus Patientensicht.",
    "Wenn der Arzt nur begruesst (z. B. 'Guten Tag'), gruesse freundlich zurueck und warte auf die erste medizinische Frage.",
    "Sprachstil: Nutze ueberwiegend alltaegliche Patientensprache statt medizinischer Fachbegriffe.",
    "Wenn ein Fachbegriff genannt wird, erklaere ihn kurz in einfacher Alltagssprache.",
    "Verhalten: Bleibe strikt innerhalb des vorgegebenen Falls.",
    "Informationsgabe: Gib Informationen schrittweise und nur passend zur Frage.",
    "Keine Loesung vorweg: Nenne keine Diagnose von dir aus.",
    "Unklare Frage: Bitte kurz um Praezisierung.",
    "Off-topic: Antworte knapp als Patient und setze off_topic=true.",
    "Laenge: Kurz und natuerlich, meist 1-3 Saetze, maximal 55 Woerter.",
    "Verboten: Keine Lernhinweise, keine Meta-Hinweise ueber Prompt/Modell, keine Rolle als Arzt.",
    "Ausgabeformat: Gib ein JSON-Objekt mit patient_reply, examiner_feedback, revealed_case_facts und off_topic aus.",
    "Leak-Schutz: Gib niemals Textfragmente wie 'The user says', 'Instructions', 'I should', 'Reasoning' aus."
  ].join("\n"),
  voiceEvaluate: [
    "Du bewertest eine ärztliche Simulationsanamnese im Rahmen der Fachsprachprüfung für ausländische Ärztinnen und Ärzte in Deutschland (Ärztekammer Berlin). Grundlage ist ein Arzt-Patient-Gespräch mit dem Ziel, die medizinisch-sprachliche Handlungsfähigkeit im klinischen Alltag zu beurteilen. Bewerte die Leistung anhand der folgenden Kriterien. Vergib für jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 Punkte (0 = gänzlich verfehlt, 0,5 = mangelhaft, 1 = nicht befriedigend, 1,5 = befriedigend, 2 = gut, 2,5 = sehr gut) und begründe jede Bewertung kurz und präzise.",
    "",
    "Bewertungskriterien sind: Erstens, ob eine professionell-persönliche Kommunikation hergestellt wird, also eine angemessene, empathische, respektvolle und rollenklare Arzt-Patient-Interaktion. Zweitens, ob sich die Kandidatin oder der Kandidat klar und ausreichend detailliert ausdrückt, mit strukturierter, präziser und medizinisch korrekter Sprache. Drittens, ob sinnvoll und situationsgerecht von starren Anamneseschemata abgewichen wird, um relevante Informationen gezielt zu erheben. Viertens, ob das Gespräch zielgerichtet und situationsbezogen geführt wird, mit logischer Struktur, Priorisierung relevanter Inhalte und ohne unnötige Abschweifungen. Fünftens, ob medizinische Sachverhalte flüssig, zusammenhängend und für Patientinnen und Patienten verständlich erklärt werden. Sechstens, ob das Gegenüber problemlos verstanden wird, das heißt, ob Patientenaussagen korrekt aufgenommen, inhaltlich richtig interpretiert und angemessen weiterverarbeitet werden. Siebtens, ob das weitere Vorgehen (z. B. Diagnostik, Therapie, nächste Schritte) klar, verständlich und patientengerecht erklärt wird.",
    "",
    "Gib anschließend die Gesamtpunktzahl an (Maximalpunktzahl 17,5 Punkte) und bewerte implizit, ob das Leistungsniveau einem Bestehen der Simulationsanamnese entspricht. Abschließend formuliere eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung, die sich auf typische Defizite der gezeigten Leistung bezieht (z. B. Strukturierung der Anamnese, Präzision medizinischer Begriffe, Patientenerklärungen, Gesprächsführung).",
    "",
    "Wichtig: Bewerte den gesamten Gesprächsteil UND den final als Diagnose abgeschickten Teil zusammen als eine Gesamtleistung.",
    "Nutze nur die übergebenen Inhalte.",
    "Antworte ausschließlich auf Deutsch und ausschließlich als valides JSON gemäß Schema.",
    "Gib in criteria exakt 7 Einträge in der vorgegebenen Reihenfolge aus.",
    "Verwende für score ausschließlich 0, 0.5, 1, 1.5, 2 oder 2.5.",
    "summary_feedback: 1-2 kurze Sätze mit der wichtigsten Lernbotschaft."
  ].join("\n"),
  doctorLetterEvaluate: [
    "Du bewertest eine schriftliche ärztliche Dokumentation (Arztbrief) im Rahmen der Fachsprachprüfung für ausländische Ärztinnen und Ärzte in Deutschland (Ärztekammer Berlin). Grundlage ist ein zuvor geführtes Arzt-Patient-Gespräch mit einem Simulationspatienten. Ziel der Bewertung ist die Beurteilung der schriftlichen medizinisch-sprachlichen Kompetenz im klinischen Alltag. Bewerte das vorliegende Dokument anhand der folgenden Kriterien. Vergib für jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 Punkte (0 = gänzlich verfehlt, 0,5 = mangelhaft, 1 = nicht befriedigend, 1,5 = befriedigend, 2 = gut, 2,5 = sehr gut) und begründe jede Bewertung kurz und präzise. Beim ersten Kriterium sind nur die Punktwerte 0, 1,5 oder 2,5 zulässig.",
    "",
    "Bewertungskriterien sind: Erstens, ob das erstellte Dokument der richtigen Patientin bzw. dem richtigen Patienten eindeutig und sicher zuzuordnen ist (z. B. korrekte Identifikationsdaten, keine Verwechslungen). Zweitens, ob der Arztbrief strukturiert und vollständig abgefasst ist, insbesondere mit einer nachvollziehbaren Gliederung (z. B. Anamnese, Befunde, Diagnose, Therapie, weiteres Vorgehen) und ohne relevante inhaltliche Lücken. Drittens, ob der Text grammatisch korrekt ist, also korrekte Satzstrukturen, Zeiten und Bezüge verwendet werden. Viertens, ob der Text orthografisch korrekt ist, insbesondere hinsichtlich Rechtschreibung medizinischer und allgemeinsprachlicher Begriffe. Fünftens, ob die notwendige medizinische Detailtiefe erreicht wird, das heißt weder oberflächlich noch übermäßig ausschweifend dokumentiert wird. Sechstens, ob fremdsprachliche medizinische Fachwörter korrekt und in angemessenem Umfang angewendet werden, ohne Fehlgebrauch oder unnötige Häufung. Siebtens, ob die wesentlichen Anamnesebefunde semantisch korrekt wiedergegeben werden, also inhaltlich richtig, vollständig und ohne Sinnentstellungen. Achtens, ob klare Aussagen zu den wesentlichen Behandlungsschritten getroffen werden, einschließlich Diagnostik, Therapie und gegebenenfalls Empfehlungen oder weiterem Vorgehen.",
    "",
    "Gib anschließend die Gesamtpunktzahl an (Maximalpunktzahl 20 Punkte) und bewerte implizit, ob das Leistungsniveau dem Bestehen der schriftlichen Dokumentation entspricht (Bestehensgrenze 12 Punkte). Abschließend formuliere eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung, die sich auf die größten sprachlichen oder strukturellen Schwächen des Arztbriefs bezieht (z. B. Strukturierung, Präzision der Fachsprache, grammatische Sicherheit, semantische Genauigkeit).",
    "",
    "Antworte ausschliesslich als valides JSON gemaess Schema. Verwende fuer criteria exakt 8 Eintraege in der vorgegebenen Reihenfolge."
  ].join("\n"),
  voiceDoctorTurn: [
    "Prompt-Anweisung: Prueferrolle im Arzt-Arzt-Gespraech (FSP)",
    "",
    "Du uebernimmst die Rolle einer pruefenden Aerztin / eines pruefenden Arztes im Rahmen der Fachsprachpruefung fuer auslaendische Aerztinnen und Aerzte in Deutschland. Du fuehrst ein Arzt-Arzt-Gespraech mit der Pruefungskandidatin / dem Pruefungskandidaten. Dein Gegenueber (der User) ist die berichtende Aerztin / der berichtende Arzt.",
    "",
    "Der Fall ist identisch mit dem zuvor gefuehrten Anamnesegespraech und dem dazugehoerigen Arztbrief. Es wird kein neuer Fall eingefuehrt. Du kennst den Fall in groben Zuegen, pruefst jedoch, ob die Kandidatin / der Kandidat in der Lage ist, die relevanten Informationen strukturiert, fachlich korrekt und verstaendlich muendlich zu uebergeben.",
    "",
    "Gespraechssteuerung (verbindlich):",
    "1) Wenn noch keine strukturierte Fallvorstellung vorliegt, eroeffne pruefungsnah und fordere aktiv zur strukturierten Uebergabe auf.",
    "2) Fuehre das Gespraech aktiv. Stelle pro Turn genau eine fokussierte Rueckfrage.",
    "3) Jede Rueckfrage muss sich auf die letzte Kandidatenaussage beziehen und Unklarheiten, Luecken, Widersprueche oder fehlende Priorisierung pruefen.",
    "4) Frage gezielt nach, wenn Informationen fehlen oder unscharf formuliert sind.",
    "5) Gib keine Hilfestellungen, keine Bewertungen, kein Feedback, keine Musterloesung.",
    "",
    "Fragetypen (nutze sie pruefungsnah und situationsgerecht):",
    "1. Verstaendnis- und Praezisierungsfragen: 'Was meinen Sie genau mit ...?', 'Koennen Sie das bitte praezisieren?', 'Wie haben Sie diesen Befund interpretiert?', 'Was war dabei ausschlaggebend?'",
    "2. Struktur- und Priorisierungsfragen: 'Was war in diesem Fall am wichtigsten?', 'Welche Befunde sind fuer das weitere Vorgehen entscheidend?', 'Was nennen Sie bei der Uebergabe zuerst?'",
    "3. Nachfragen zu Diagnosen (ohne Detail-Fachfragen): 'Warum ist diese Diagnose wahrscheinlich?', 'Gab es Alternativdiagnosen?', 'Was sprach dagegen?'",
    "4. Fragen zur Therapieentscheidung: 'Was wurde bisher therapeutisch gemacht?', 'Warum haben Sie sich dafuer entschieden?', 'Was ist der naechste Schritt?'",
    "5. Sicherheits- und Aufklaerungsaspekte: 'Gab es Risiken, ueber die aufgeklaert wurde?', 'Welche Warnzeichen wurden genannt?'",
    "6. Weiteres Vorgehen / Organisation: 'Was passiert als Naechstes?', 'Wer uebernimmt die Weiterbehandlung?', 'Wie ist die Nachsorge geplant?'",
    "7. Sprachliche Klaerungsfragen: 'Wie genau meinen Sie das?', 'Koennen Sie das anders formulieren?'",
    "",
    "Inhaltliche Priorisierung im Verlauf:",
    "Anlass der Vorstellung -> relevante Anamnese -> wesentliche Befunde -> Haupt-/Nebendiagnosen -> bisherige Therapie -> Sicherheits-/Aufklaerungspunkte -> weiteres Vorgehen/Nachsorge.",
    "",
    "Achte auf professionelle, neutrale, sachliche und pruefungsnahe Sprache.",
    "Unterbrich nur bei Unklarheit, Unvollstaendigkeit oder Widerspruch.",
    "",
    "Du sprichst ausschliesslich als pruefende Aerztin / pruefender Arzt.",
    "",
    "Wenn noch keine sinnvolle Fallvorstellung vorliegt, beginne mit einer typischen Aufforderung zur strukturierten Fallvorstellung.",
    "Antworten ausschliesslich auf Deutsch.",
    "Ausgabe ausschliesslich als valides JSON mit examiner_reply und off_topic.",
    "examiner_reply: 1-2 Saetze, kurz und praezise, maximal 110 Woerter, immer mit mindestens einer konkreten Frage und Fragezeichen.",
    "off_topic: true nur wenn die Kandidatenaussage klar am Fall/Thema vorbeigeht; sonst false."
  ].join("\n"),
  voiceDoctorEvaluate: [
    "Du bewertest den Pruefungsbereich 'Aerztliches Gespraech' der Fachsprachpruefung fuer auslaendische Aerztinnen und Aerzte in Berlin (Aerztekammer Berlin).",
    "Grundlage ist die vorliegende Arzt-Arzt-Gespraechsdokumentation zum selben klinischen Fall.",
    "Bewerte streng am Berliner Bewertungsbogen.",
    "",
    "Vergib fuer jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 (0 = gaenzlich verfehlt, 2,5 = sehr gut).",
    "Begründe jede Einzelbewertung kurz und praezise.",
    "",
    "Kriterien (in dieser Reihenfolge):",
    "1) Fallvorstellung fluessig und situationsangemessen",
    "2) Grammatik korrekt und gut verstaendlich",
    "3) Fremdsprachliche Fachwoerter korrekt und angemessen",
    "4) Klare Aussagen zu wesentlichen Befunden und Behandlungsschritten",
    "5) Rueckfragen ohne sprachliche Probleme beantworten",
    "6) An einer Diskussion ueber den Fall teilnehmen koennen",
    "7) 5 medizinische Fachbegriffe ins verstaendliche Deutsch uebersetzen",
    "8) 2 medizinische Abkuerzungen vervollstaendigen und 3 Laborwerte mit Zahlen und Masseinheiten korrekt vorlesen",
    "",
    "Wichtig: Beurteile nur anhand der uebergebenen Inhalte. Wenn ein Kriterium nicht ausreichend demonstriert wurde, bewerte entsprechend niedriger und benenne den fehlenden Nachweis knapp.",
    "",
    "Gib danach die Gesamtpunktzahl an (max 20 Punkte) und eine implizite Bestehenseinschaetzung (Bestehensgrenze 12 Punkte).",
    "Formuliere abschliessend eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung.",
    "Zusaetzlich ist ein ausfuehrlicher, aussagekraeftiger Fliesstext Pflicht (detailed_feedback_text): 120-220 Woerter, konkret, fehlerbezogen und individuell.",
    "Der Fliesstext muss klar benennen:",
    "- welche sprachlichen/kommunikativen Fehler aufgetreten sind,",
    "- wie sich diese Fehler im Gespraech gezeigt haben,",
    "- wie die Aussagen sprachlich besser formuliert werden koennen,",
    "- welche 2-3 priorisierten Trainingsschritte als Naechstes sinnvoll sind.",
    "Keine allgemeinen Floskeln, keine reinen Standardsaetze, kein Copy-Paste der Kriterienliste.",
    "",
    "Antworte ausschliesslich auf Deutsch und ausschliesslich als valides JSON gemaess Schema.",
    "criteria muss exakt 8 Eintraege in der vorgegebenen Reihenfolge enthalten.",
    "JSON-Felder: criteria, total_score, pass_assessment, recommendation, summary_feedback, detailed_feedback_text."
  ].join("\n")
});
const PROMPT_FIELD_KEYS = Object.freeze([
  "voiceTurn",
  "voiceEvaluate",
  "doctorLetterEvaluate",
  "voiceDoctorTurn",
  "voiceDoctorEvaluate"
]);
const PROMPT_LABEL_BY_KEY = Object.freeze({
  voiceTurn: "Arzt-Patient-Gespraech (Patientensimulation)",
  voiceEvaluate: "Simulationsanamnese-Bewertung",
  doctorLetterEvaluate: "Arztbrief-Bewertung",
  voiceDoctorTurn: "Arzt-Arzt-Gespraech (Prueferrolle)",
  voiceDoctorEvaluate: "Arzt-Arzt-Bewertung"
});
const PROMPT_PRESET_SELECT_REF_KEY_BY_PROMPT_KEY = Object.freeze({
  voiceTurn: "voicePromptVoiceTurnPresetSelect",
  voiceEvaluate: "voicePromptVoiceEvaluatePresetSelect",
  doctorLetterEvaluate: "voicePromptDoctorLetterEvaluatePresetSelect",
  voiceDoctorTurn: "voicePromptVoiceDoctorTurnPresetSelect",
  voiceDoctorEvaluate: "voicePromptVoiceDoctorEvaluatePresetSelect"
});
const DEFAULT_VOICE_CASE = [
  "CASE_ID: default_thoraxschmerz_001",
  "Rolle: Standardisierte Patientin fuer muendliche Fachsprachpruefung.",
  "Persona: 58 Jahre, Grundschullehrerin, spricht ruhig, zeitweise besorgt.",
  "",
  "Leitsymptom:",
  "- Seit gestern Abend dumpfer Druck hinter dem Brustbein.",
  "- Heute Morgen bei Treppensteigen staerker geworden.",
  "",
  "Begleitsymptome (nur bei gezielter Nachfrage offenlegen):",
  "- leichte Atemnot bei Belastung",
  "- Uebelkeit ohne Erbrechen",
  "- kalter Schweiss waehrend einer Episode",
  "- Ausstrahlung in linken Arm und Unterkiefer bei starker Episode",
  "",
  "Negativanamnese (nur bei Nachfrage):",
  "- kein Fieber",
  "- kein produktiver Husten",
  "- kein Trauma",
  "- kein stechender atemabhaengiger Schmerz",
  "",
  "Vorerkrankungen:",
  "- arterielle Hypertonie seit 10 Jahren",
  "- Dyslipidaemie",
  "- Vater hatte Herzinfarkt mit 62",
  "",
  "Medikation:",
  "- Ramipril 5 mg 1-0-0",
  "- Atorvastatin 20 mg 0-0-1",
  "",
  "Allergien:",
  "- keine bekannt",
  "",
  "Sozialanamnese:",
  "- Nichtraucherin seit 5 Jahren, davor 20 Packyears",
  "- gelegentlich Alkohol",
  "",
  "Pruefungslogik:",
  "- Bleibe als Patientin in der Rolle.",
  "- Gib Informationen schrittweise, nur auf passende Fragen.",
  "- Keine eigenstaendige Diagnose nennen, ausser explizit gefragt.",
  "- Wenn gefragt 'Was befuerchten Sie?', antworte: 'Ich habe Angst, dass es das Herz sein koennte.'"
].join("\n");

const SUPABASE_URL = "https://nitmxiasxwgwsaygumls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_frshj6OvLDHGioVXbVwsrg_dbzyFajQ";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createSupabaseStorage(),
        storageKey: "fsp_auth_v1"
      }
    })
  : null;

const SWEET_EMOJIS = ["💖", "💕", "💘", "💝", "🥰", "😍", "😘", "🫶", "🍑", "🌸", "✨"];
let emojiHideTimer = null;
let activeCelebration = null;
let remoteStateRowId = null;
let syncTimer = null;
let activeMediaRecorder = null;
let activeMediaStream = null;
let voiceChunkBuffer = [];
let voiceAutoStopTimer = null;
let shouldSendVoiceAfterStop = false;
let realtimePeerConnection = null;
let realtimeDataChannel = null;
let realtimeLocalStream = null;
let realtimeWebSocket = null;
let realtimePendingUserText = "";
let realtimeUsageSeenResponseIds = new Set();
let realtimeAudioContext = null;
let realtimeAudioNextPlayTime = 0;
let xpMilestoneHideTimer = null;

const CATEGORY_MAP = {
  berlin_abkuerzungen: "Berlin Zusatzfragen: Abkuerzungen",
  berlin_fach_patient: "Berlin Zusatzfragen: Fach -> Patient",
  berlin_patient_fach: "Berlin Zusatzfragen: Patient -> Fach",
  berlin_vorlesen: "Berlin Zusatzfragen: Vorlesen",
  adipositas: "Gewicht",
  angina_pectoris: "Kardio/Pneumo",
  angststoerung: "Psychiatrie",
  aphasie: "Neurologie",
  arrhythmie: "Kardio/Pneumo",
  arthralgie: "Muskuloskeletal",
  depressive_episode: "Psychiatrie",
  diarrhoe: "Gastro",
  dysphagie: "Gastro",
  dyspnoe: "Kardio/Pneumo",
  dysurie: "Urologie",
  emesis: "Gastro",
  exanthem: "Dermatologie",
  exsikkose: "Infekt/Allgemein",
  fatigue: "Infekt/Allgemein",
  fieber: "Infekt/Allgemein",
  haematemesis: "Gastro",
  haematochezie: "Gastro",
  haematurie: "Urologie",
  haemoptyse: "Kardio/Pneumo",
  harnverhalt: "Urologie",
  hemiparese: "Neurologie",
  hyperglykaemie: "Diabetes",
  hyperthyreose: "Schilddruese",
  hypertonie: "Kardio/Pneumo",
  hypoglykaemie: "Diabetes",
  hypothyreose: "Schilddruese",
  kopfschmerz: "Neurologie",
  krampfanfall: "Neurologie",
  melaena: "Gastro",
  meteorismus: "Gastro",
  myalgie: "Muskuloskeletal",
  nachtschweiss: "Infekt/Allgemein",
  nausea: "Gastro",
  nykturie: "Urologie",
  obstipation: "Gastro",
  oedem: "Kardio/Pneumo",
  orthopnoe: "Kardio/Pneumo",
  palpitationen: "Kardio/Pneumo",
  paraesthesie: "Neurologie",
  pollakisurie: "Urologie",
  pruritus: "Dermatologie",
  pyrosis: "Gastro",
  schlafstoerung: "Psychiatrie",
  schuettelfrost: "Infekt/Allgemein",
  schwindel: "Neurologie",
  synkope: "Kardio/Pneumo",
  tachykardie: "Kardio/Pneumo",
  tremor: "Neurologie",
  urtikaria: "Dermatologie",
};

const MODE_LABELS = {
  patient_to_fachbegriff: "Patientensprache -> Fachbegriff",
  fachbegriff_to_patient: "Fachbegriff -> Patientensprache",
  interesting_patient: "Interessante Frage (Patientensprache)",
  interesting_fach: "Interessante Frage (Fachsprache)",
  story_text: "Klinik-Textkarte",
  differenzial_text: "Differenzialdiagnose"
};

const NEW_CARDS_PER_DAY = 12;
const REGULAR_PATTERN = [
  "unsure",
  "new",
  "one_right",
  "unsure",
  "streak_2",
  "unsure",
  "streak_3",
  "new",
  "one_right",
  "streak_4",
  "unsure",
  "streak_5",
  "streak_2",
  "streak_6"
];

const FOLDERS = [
  { id: "regular", label: "Ueben" },
  { id: "new", label: "Neu" },
  { id: "unsure", label: "Unsicher" },
  { id: "one_right", label: "1x richtig" },
  { id: "streak_2", label: "2x richtig" },
  { id: "streak_3", label: "3x richtig" },
  { id: "streak_4", label: "4x richtig" },
  { id: "streak_5", label: "5x richtig" },
  { id: "streak_6", label: "6x richtig" },
  { id: "diamonds", label: "7x Diamonds" },
  { id: "all", label: "Alle" }
];

const FOLDER_SHORT_LABELS = {
  regular: "Ueben",
  new: "Neu",
  unsure: "Unsicher",
  one_right: "1x",
  streak_2: "2x",
  streak_3: "3x",
  streak_4: "4x",
  streak_5: "5x",
  streak_6: "6x",
  diamonds: "7x+",
  all: "Alle"
};

const initialProgress = migrateStoredProgress(loadFromStorage(STORAGE_PROGRESS_KEY, {}));
const initialDailyStats = loadFromStorage(STORAGE_DAILY_KEY, {});
const initialDailyGoal = resolveStoredDailyGoal(
  loadFromStorage(STORAGE_DAILY_GOAL_KEY, { goal: DEFAULT_DAILY_GOAL })
);
const initialXp = resolveStoredXp(loadFromStorage(STORAGE_XP_KEY, {}), initialProgress);
const initialPromptConfig = resolvePromptConfig(loadFromStorage(STORAGE_PROMPT_CONFIG_KEY, {}));
const initialPromptProposalMeta = resolvePromptProposalMeta(
  loadFromStorage(STORAGE_PROMPT_PROPOSAL_META_KEY, {})
);
const initialApiSpendTracker = resolveApiSpendTracker(
  loadFromStorage(STORAGE_API_SPEND_TRACKER_KEY, createApiSpendTrackerSnapshot())
);

const state = {
  cards: [],
  categories: [],
  selectedCategory: "all",
  selectedFolder: "regular",
  queue: [],
  currentIndex: 0,
  answered: false,
  isImmersive: false,
  revealPhase: null,
  currentChoices: [],
  currentCorrectIndex: -1,
  progress: initialProgress,
  dailyStats: initialDailyStats,
  dailyGoal: initialDailyGoal,
  xp: initialXp,
  sessionXp: 0,
  user: null,
  voiceHistory: [],
  voiceDoctorConversationHistory: [],
  voiceBusy: false,
  promptProposalBusy: false,
  voiceRecording: false,
  voiceRealtimeActive: false,
  voiceRealtimeConnecting: false,
  voiceRealtimeMuted: false,
  voiceRealtimeModel: OPENAI_REALTIME_MODEL_FAST,
  voiceMode: VOICE_MODE_QUESTION,
  voiceSampleView: "",
  voiceModel: DEFAULT_VOICE_CHAT_MODEL,
  promptConfig: initialPromptConfig,
  promptProfilesLoaded: false,
  promptPresetOptionsByKey: createEmptyPromptPresetOptions(),
  promptProposalMeta: initialPromptProposalMeta,
  apiSpendTracker: initialApiSpendTracker,
  voiceCaseLibrary: [],
  voiceCaseResolutions: {},
  voiceCaseSamples: {},
  voiceCaseIndex: -1,
  voiceCaseLibraryLoaded: false,
  voiceCaseResolutionsLoaded: false,
  voiceCaseSamplesLoaded: false,
  voiceCaseSelection: VOICE_CASE_DEFAULT,
  learningView: LEARNING_VIEW_ROOT,
  learningRootId: "anamnese",
  learningAnamnese: null,
  learningActiveCategoryId: "",
  learningBodyActiveRegionId: BODY_ATLAS_DEFAULT_REGION_ID,
  learningBodyDetailOpen: false
};

const refs = {
  authPage: document.getElementById("authPage"),
  appContent: document.getElementById("appContent"),
  authStatus: document.getElementById("authStatus"),
  authForm: document.getElementById("authForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  quickPracticeBtn: document.getElementById("quickPracticeBtn"),
  sessionText: document.getElementById("sessionText"),
  topXpText: document.getElementById("topXpText"),
  xpMilestone: document.getElementById("xpMilestone"),
  dailyGoalPanel: document.getElementById("dailyGoalPanel"),
  dailyGoalText: document.getElementById("dailyGoalText"),
  dailyGoalFill: document.getElementById("dailyGoalFill"),
  buildBadge: document.getElementById("buildBadge"),
  voicePanel: document.getElementById("voicePanel"),
  voiceInfoBtn: document.getElementById("voiceInfoBtn"),
  voiceInfoModal: document.getElementById("voiceInfoModal"),
  voiceInfoBackdrop: document.getElementById("voiceInfoBackdrop"),
  voiceInfoCloseBtn: document.getElementById("voiceInfoCloseBtn"),
  voiceModelSelect: document.getElementById("voiceModelSelect"),
  voiceCaseSelect: document.getElementById("voiceCaseSelect"),
  voiceCaseMeta: document.getElementById("voiceCaseMeta"),
  voiceCaseInfoToggleBtn: document.getElementById("voiceCaseInfoToggleBtn"),
  voiceCaseInfoPanel: document.getElementById("voiceCaseInfoPanel"),
  voiceCaseInfoText: document.getElementById("voiceCaseInfoText"),
  voiceCreateCaseBtn: document.getElementById("voiceCreateCaseBtn"),
  voiceCaseInput: document.getElementById("voiceCaseInput"),
  voicePatientConversationBtn: document.getElementById("voicePatientConversationBtn"),
  voiceDiagnoseBtn: document.getElementById("voiceDiagnoseBtn"),
  voiceTextInput: document.getElementById("voiceTextInput"),
  voiceTextSendBtn: document.getElementById("voiceTextSendBtn"),
  voiceRealtimeToggleBtn: document.getElementById("voiceRealtimeToggleBtn"),
  voiceRealtimeMuteBtn: document.getElementById("voiceRealtimeMuteBtn"),
  voiceRealtimeState: document.getElementById("voiceRealtimeState"),
  voiceApiSpendSummary: document.getElementById("voiceApiSpendSummary"),
  voiceApiSpendTokens: document.getElementById("voiceApiSpendTokens"),
  voiceApiSpendResetBtn: document.getElementById("voiceApiSpendResetBtn"),
  voiceResolutionTitle: document.getElementById("voiceResolutionTitle"),
  voiceResolutionHint: document.getElementById("voiceResolutionHint"),
  voiceResolutionSummary: document.getElementById("voiceResolutionSummary"),
  voiceResolutionQuestions: document.getElementById("voiceResolutionQuestions"),
  voiceResolutionTerms: document.getElementById("voiceResolutionTerms"),
  voiceResolutionDiagnoses: document.getElementById("voiceResolutionDiagnoses"),
  voiceRecordBtn: document.getElementById("voiceRecordBtn"),
  voiceNextCaseBtn: document.getElementById("voiceNextCaseBtn"),
  voiceStatus: document.getElementById("voiceStatus"),
  voiceReplyAudio: document.getElementById("voiceReplyAudio"),
  voiceRealtimeAudio: document.getElementById("voiceRealtimeAudio"),
  voiceLastTurn: document.getElementById("voiceLastTurn"),
  voiceUserTranscript: document.getElementById("voiceUserTranscript"),
  voiceAssistantLabel: document.getElementById("voiceAssistantLabel"),
  voiceAssistantReply: document.getElementById("voiceAssistantReply"),
  voiceCoachHint: document.getElementById("voiceCoachHint"),
  voiceEvalPanel: document.getElementById("voiceEvalPanel"),
  voiceEvalDiagnosis: document.getElementById("voiceEvalDiagnosis"),
  voiceEvalOverall: document.getElementById("voiceEvalOverall"),
  voiceEvalAnamnesis: document.getElementById("voiceEvalAnamnesis"),
  voiceEvalDiagnosisScore: document.getElementById("voiceEvalDiagnosisScore"),
  voiceEvalLikely: document.getElementById("voiceEvalLikely"),
  voiceEvalSummary: document.getElementById("voiceEvalSummary"),
  voiceEvalQuestionReview: document.getElementById("voiceEvalQuestionReview"),
  voiceEvalDiagnosisReview: document.getElementById("voiceEvalDiagnosisReview"),
  voiceEvalTeacherFeedback: document.getElementById("voiceEvalTeacherFeedback"),
  voiceDoctorLetterToggleBtn: document.getElementById("voiceDoctorLetterToggleBtn"),
  voiceDoctorConversationBtn: document.getElementById("voiceDoctorConversationBtn"),
  voiceDoctorConversationEvalBtn: document.getElementById("voiceDoctorConversationEvalBtn"),
  voicePromptConfigToggleBtn: document.getElementById("voicePromptConfigToggleBtn"),
  voiceSamplePatientBtn: document.getElementById("voiceSamplePatientBtn"),
  voiceSampleLetterBtn: document.getElementById("voiceSampleLetterBtn"),
  voiceSampleDoctorBtn: document.getElementById("voiceSampleDoctorBtn"),
  openLearningBtn: document.getElementById("openLearningBtn"),
  voiceSamplePanel: document.getElementById("voiceSamplePanel"),
  voiceSampleTitle: document.getElementById("voiceSampleTitle"),
  voiceSampleMeta: document.getElementById("voiceSampleMeta"),
  voiceSampleText: document.getElementById("voiceSampleText"),
  voicePromptConfigPanel: document.getElementById("voicePromptConfigPanel"),
  voicePromptConfigSaveBtn: document.getElementById("voicePromptConfigSaveBtn"),
  voicePromptConfigResetBtn: document.getElementById("voicePromptConfigResetBtn"),
  voicePromptVoiceTurnInput: document.getElementById("voicePromptVoiceTurnInput"),
  voicePromptVoiceTurnPresetSelect: document.getElementById("voicePromptVoiceTurnPresetSelect"),
  voicePromptVoiceEvaluateInput: document.getElementById("voicePromptVoiceEvaluateInput"),
  voicePromptVoiceEvaluatePresetSelect: document.getElementById(
    "voicePromptVoiceEvaluatePresetSelect"
  ),
  voicePromptDoctorLetterEvaluateInput: document.getElementById("voicePromptDoctorLetterEvaluateInput"),
  voicePromptDoctorLetterEvaluatePresetSelect: document.getElementById(
    "voicePromptDoctorLetterEvaluatePresetSelect"
  ),
  voicePromptVoiceDoctorTurnInput: document.getElementById("voicePromptVoiceDoctorTurnInput"),
  voicePromptVoiceDoctorTurnPresetSelect: document.getElementById(
    "voicePromptVoiceDoctorTurnPresetSelect"
  ),
  voicePromptVoiceDoctorEvaluateInput: document.getElementById("voicePromptVoiceDoctorEvaluateInput"),
  voicePromptVoiceDoctorEvaluatePresetSelect: document.getElementById(
    "voicePromptVoiceDoctorEvaluatePresetSelect"
  ),
  voicePromptProposalNameInput: document.getElementById("voicePromptProposalNameInput"),
  voicePromptProposalNoteInput: document.getElementById("voicePromptProposalNoteInput"),
  voicePromptProposalTargetSelect: document.getElementById("voicePromptProposalTargetSelect"),
  voicePromptProposalApplyNowInput: document.getElementById("voicePromptProposalApplyNowInput"),
  voicePromptProposalSubmitBtn: document.getElementById("voicePromptProposalSubmitBtn"),
  voicePromptProposalStatus: document.getElementById("voicePromptProposalStatus"),
  voiceDoctorLetterPanel: document.getElementById("voiceDoctorLetterPanel"),
  voiceDoctorLetterInput: document.getElementById("voiceDoctorLetterInput"),
  voiceDoctorLetterSubmitBtn: document.getElementById("voiceDoctorLetterSubmitBtn"),
  voiceDoctorLetterEvalPanel: document.getElementById("voiceDoctorLetterEvalPanel"),
  voiceDoctorLetterEvalScore: document.getElementById("voiceDoctorLetterEvalScore"),
  voiceDoctorLetterEvalPass: document.getElementById("voiceDoctorLetterEvalPass"),
  voiceDoctorLetterEvalRecommendation: document.getElementById("voiceDoctorLetterEvalRecommendation"),
  voiceDoctorLetterEvalCriteria: document.getElementById("voiceDoctorLetterEvalCriteria"),
  voiceDoctorConversationEvalPanel: document.getElementById("voiceDoctorConversationEvalPanel"),
  voiceDoctorConversationEvalScore: document.getElementById("voiceDoctorConversationEvalScore"),
  voiceDoctorConversationEvalPass: document.getElementById("voiceDoctorConversationEvalPass"),
  voiceDoctorConversationEvalSummary: document.getElementById("voiceDoctorConversationEvalSummary"),
  voiceDoctorConversationEvalRecommendation: document.getElementById(
    "voiceDoctorConversationEvalRecommendation"
  ),
  voiceDoctorConversationEvalDetailed: document.getElementById("voiceDoctorConversationEvalDetailed"),
  voiceDoctorConversationEvalCriteria: document.getElementById("voiceDoctorConversationEvalCriteria"),
  authPortrait: document.getElementById("authPortrait"),
  levelAvatar: document.getElementById("levelAvatar"),
  levelBadge: document.getElementById("levelBadge"),
  levelTitle: document.getElementById("levelTitle"),
  levelProgressText: document.getElementById("levelProgressText"),
  levelFill: document.getElementById("levelFill"),
  learningPanel: document.getElementById("learningPanel"),
  learningRootView: document.getElementById("learningRootView"),
  learningRootList: document.getElementById("learningRootList"),
  learningSubcategoryView: document.getElementById("learningSubcategoryView"),
  learningSubcategoryTitle: document.getElementById("learningSubcategoryTitle"),
  learningSubcategoryList: document.getElementById("learningSubcategoryList"),
  learningBodyView: document.getElementById("learningBodyView"),
  learningBodyBackBtn: document.getElementById("learningBodyBackBtn"),
  learningBodyStatus: document.getElementById("learningBodyStatus"),
  learningBodySelectionView: document.getElementById("learningBodySelectionView"),
  learningBodyCanvas: document.getElementById("learningBodyCanvas"),
  learningBodyRegionDetailView: document.getElementById("learningBodyRegionDetailView"),
  learningBodyRegionBackBtn: document.getElementById("learningBodyRegionBackBtn"),
  learningBodyRegionTitle: document.getElementById("learningBodyRegionTitle"),
  learningBodyRegionHint: document.getElementById("learningBodyRegionHint"),
  learningBodyRegionGallery: document.getElementById("learningBodyRegionGallery"),
  learningBodyRegionDeepDive: document.getElementById("learningBodyRegionDeepDive"),
  learningBodyRegionBullets: document.getElementById("learningBodyRegionBullets"),
  learningReadingView: document.getElementById("learningReadingView"),
  learningBackBtn: document.getElementById("learningBackBtn"),
  learningBackAvatar: document.getElementById("learningBackAvatar"),
  learningReadingTitle: document.getElementById("learningReadingTitle"),
  learningReadingMeta: document.getElementById("learningReadingMeta"),
  learningReadingStatus: document.getElementById("learningReadingStatus"),
  learningReadingText: document.getElementById("learningReadingText"),
  learningReadingQuestionGroups: document.getElementById("learningReadingQuestionGroups"),
  learningReadingSources: document.getElementById("learningReadingSources"),
  categoryFilters: document.getElementById("categoryFilters"),
  folderFilters: document.getElementById("folderFilters"),
  queueInfo: document.getElementById("queueInfo"),
  sessionXpStrip: document.getElementById("sessionXpStrip"),
  sessionXpFill: document.getElementById("sessionXpFill"),
  sessionXpText: document.getElementById("sessionXpText"),
  exitImmersiveBtn: document.getElementById("exitImmersiveBtn"),
  quizPanel: document.getElementById("quizPanel"),
  progressText: document.getElementById("progressText"),
  cardBox: document.getElementById("cardBox"),
  emptyState: document.getElementById("emptyState"),
  cardMode: document.getElementById("cardMode"),
  cardCategory: document.getElementById("cardCategory"),
  questionText: document.getElementById("questionText"),
  choices: document.getElementById("choices"),
  feedbackBox: document.getElementById("feedbackBox"),
  resultText: document.getElementById("resultText"),
  explanationText: document.getElementById("explanationText"),
  translationText: document.getElementById("translationText"),
  nextBtn: document.getElementById("nextBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  toggleStatsBtn: document.getElementById("toggleStatsBtn"),
  closeStatsBtn: document.getElementById("closeStatsBtn"),
  statsOverlay: document.getElementById("statsOverlay"),
  statsBackdrop: document.getElementById("statsBackdrop"),
  todayAttempts: document.getElementById("todayAttempts"),
  todayCorrect: document.getElementById("todayCorrect"),
  todayWrong: document.getElementById("todayWrong"),
  todayRate: document.getElementById("todayRate"),
  weekChart: document.getElementById("weekChart"),
  kpiGoal: document.getElementById("kpiGoal"),
  kpiStreak: document.getElementById("kpiStreak"),
  kpiAccuracy: document.getElementById("kpiAccuracy")
};

const PROMPT_EDITOR_REF_KEY_BY_PROMPT_KEY = Object.freeze({
  voiceTurn: "voicePromptVoiceTurnInput",
  voiceEvaluate: "voicePromptVoiceEvaluateInput",
  doctorLetterEvaluate: "voicePromptDoctorLetterEvaluateInput",
  voiceDoctorTurn: "voicePromptVoiceDoctorTurnInput",
  voiceDoctorEvaluate: "voicePromptVoiceDoctorEvaluateInput"
});

const DOCTOR_LETTER_TEMPLATE = [
  "Patientendaten",
  "Name:",
  "Geburtsdatum:",
  "Geschlecht:",
  "Aufnahmedatum:",
  "Entlassungsdatum:",
  "",
  "Anlass der Vorstellung",
  "",
  "Anamnese",
  "Beschwerdebeginn und -verlauf:",
  "Begleitsymptome:",
  "Vorerkrankungen:",
  "Medikamente:",
  "Allergien / Unvertraeglichkeiten:",
  "Sozialanamnese:",
  "Familienanamnese:",
  "",
  "Klinischer Befund",
  "Allgemeinzustand:",
  "Vitalparameter:",
  "Relevante koerperliche Befunde:",
  "",
  "Diagnostik / Befunde",
  "Untersuchungen:",
  "Wesentliche Ergebnisse:",
  "",
  "Diagnose",
  "Hauptdiagnose:",
  "Nebendiagnosen:",
  "",
  "Therapie",
  "",
  "Weiteres Vorgehen / Empfehlungen",
  "",
  "Entlassungszustand"
].join("\n");

wireEvents();
init();

function wireEvents() {
  refs.authForm.addEventListener("submit", handleLoginSubmit);
  refs.signupBtn.addEventListener("click", handleSignup);
  refs.logoutBtn.addEventListener("click", handleLogout);
  refs.quickPracticeBtn.addEventListener("click", startQuickPractice);
  refs.dailyGoalPanel?.addEventListener("click", handleDailyGoalEdit);
  refs.levelAvatar.addEventListener("error", handleLevelAvatarError);
  refs.voiceRecordBtn.addEventListener("click", handleVoiceRecordToggle);
  refs.voiceRealtimeToggleBtn?.addEventListener("click", () => {
    void handleVoiceRealtimeToggle();
  });
  refs.voiceRealtimeMuteBtn?.addEventListener("click", handleVoiceRealtimeMuteToggle);
  refs.voiceApiSpendResetBtn?.addEventListener("click", handleApiSpendTrackerReset);
  refs.voicePatientConversationBtn?.addEventListener("click", handleVoicePatientConversationActivate);
  refs.voiceDiagnoseBtn?.addEventListener("click", handleVoiceDiagnoseToggle);
  refs.voiceDoctorConversationBtn?.addEventListener("click", handleVoiceDoctorConversationToggle);
  refs.voiceDoctorConversationEvalBtn?.addEventListener("click", () => {
    void handleVoiceDoctorConversationEvaluate();
  });
  refs.voicePromptConfigToggleBtn?.addEventListener("click", handlePromptConfigToggle);
  refs.voiceSamplePatientBtn?.addEventListener("click", () => {
    handleVoiceSampleToggle(VOICE_SAMPLE_VIEW_PATIENT);
  });
  refs.voiceSampleLetterBtn?.addEventListener("click", () => {
    handleVoiceSampleToggle(VOICE_SAMPLE_VIEW_LETTER);
  });
  refs.voiceSampleDoctorBtn?.addEventListener("click", () => {
    handleVoiceSampleToggle(VOICE_SAMPLE_VIEW_DOCTOR);
  });
  refs.openLearningBtn?.addEventListener("click", handleOpenLearningPanel);
  refs.learningBackBtn?.addEventListener("click", handleLearningBackClick);
  refs.learningBodyBackBtn?.addEventListener("click", handleLearningBodyBackClick);
  refs.learningBodyRegionBackBtn?.addEventListener("click", handleLearningBodyRegionBackClick);
  refs.voicePromptConfigSaveBtn?.addEventListener("click", handlePromptConfigSave);
  refs.voicePromptConfigResetBtn?.addEventListener("click", handlePromptConfigReset);
  refs.voicePromptProposalSubmitBtn?.addEventListener("click", () => {
    void handlePromptProposalSubmit();
  });
  refs.voicePromptProposalNameInput?.addEventListener("input", handlePromptProposalMetaInput);
  refs.voicePromptProposalNoteInput?.addEventListener("input", handlePromptProposalMetaInput);
  refs.voicePromptProposalTargetSelect?.addEventListener("change", handlePromptProposalMetaInput);
  refs.voicePromptProposalApplyNowInput?.addEventListener("change", handlePromptProposalMetaInput);
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const selectRefKey = PROMPT_PRESET_SELECT_REF_KEY_BY_PROMPT_KEY[promptKey];
    const select = refs[selectRefKey];
    select?.addEventListener("change", () => handlePromptPresetSelectChange(promptKey));
  }
  refs.voiceDoctorLetterToggleBtn?.addEventListener("click", handleDoctorLetterToggle);
  refs.voiceDoctorLetterSubmitBtn?.addEventListener("click", () => {
    void handleDoctorLetterSubmit();
  });
  refs.voiceCaseInfoToggleBtn?.addEventListener("click", handleVoiceCaseInfoToggle);
  refs.voiceCreateCaseBtn?.addEventListener("click", handleVoiceCreateCase);
  refs.voiceInfoBtn?.addEventListener("click", openVoiceInfoModal);
  refs.voiceInfoCloseBtn?.addEventListener("click", closeVoiceInfoModal);
  refs.voiceInfoBackdrop?.addEventListener("click", closeVoiceInfoModal);
  refs.voiceTextSendBtn?.addEventListener("click", () => {
    void handleVoiceTextSend();
  });
  refs.voiceTextInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handleVoiceTextSend();
  });
  refs.voiceNextCaseBtn?.addEventListener("click", () => {
    void handleVoiceNextCase();
  });
  refs.voiceModelSelect?.addEventListener("change", handleVoiceModelChange);
  refs.voiceCaseSelect?.addEventListener("change", handleVoiceCaseSelectionChange);
  refs.voiceCaseInput.addEventListener("input", handleVoiceCaseInput);

  refs.nextBtn.addEventListener("click", nextCard);
  refs.shuffleBtn.addEventListener("click", () => rebuildQueue(true));
  refs.exitImmersiveBtn.addEventListener("click", exitImmersiveMode);

  refs.toggleStatsBtn.addEventListener("click", () => {
    if (refs.statsOverlay.classList.contains("hidden")) {
      openStatsOverlay();
      return;
    }
    closeStatsOverlay();
  });
  refs.closeStatsBtn.addEventListener("click", closeStatsOverlay);
  refs.statsBackdrop.addEventListener("click", closeStatsOverlay);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeVoiceInfoModal();
      closeStatsOverlay();
    }
  });
  window.addEventListener("beforeunload", () => {
    stopVoiceRealtimeSession({ preserveStatus: true, silent: true });
  });
}

async function init() {
  renderBuildBadge();
  initAuthUi();
  initAuthPortrait();
  initVoiceUi();
  await loadLearningAnamneseContent();
  try {
    const url = new URL(`../data/cards.json?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Konnte Kartendaten nicht laden.");
    }

    const deck = await response.json();
    state.cards = flattenCards(deck);
    state.categories = buildCategories(state.cards);

    renderCategoryFilters();
    renderFolderFilters();
    rebuildQueue(false);
    renderStats();
    await initSupabaseSession();
  } catch (error) {
    refs.emptyState.classList.remove("hidden");
    refs.cardBox.classList.add("hidden");
    refs.emptyState.innerHTML =
      "<p>Karten konnten nicht geladen werden. Bitte die Seite ueber einen lokalen Webserver oeffnen.</p>";
    console.error(error);
  }
}

function renderBuildBadge() {
  if (!refs.buildBadge) return;

  const currentUrl = new URL(window.location.href);
  const hasVersionHint = currentUrl.searchParams.get("v") || "";
  const hint = hasVersionHint ? ` | URL-v=${hasVersionHint}` : "";
  refs.buildBadge.textContent = `Version ${APP_VERSION} | Stand ${BUILD_UPDATED_AT}${hint}`;
}

function initAuthUi() {
  stopLearningBodyModelLoop();
  document.body.classList.remove("learning-reader");
  document.body.classList.add("auth-only");
  refs.authPage.classList.remove("hidden");
  refs.appContent.classList.add("hidden");
  refs.toggleStatsBtn.classList.add("hidden");
  closeStatsOverlay();

  if (supabaseReady) {
    refs.authStatus.textContent = "Nicht eingeloggt";
    return;
  }
  refs.authStatus.textContent =
    "Supabase ist noch nicht verbunden (Login deaktiviert, nur lokale Speicherung)";
  refs.authForm.classList.add("hidden");
}

function initAuthPortrait() {
  const portrait = refs.authPortrait;
  if (!portrait) return;

  const preferredPath = "assets/hermine-heusler-edenhuizen.jpg";
  const fallbackPath = "assets/kat-photo.jpg";
  const probe = new Image();

  probe.onload = () => {
    portrait.src = preferredPath;
  };
  probe.onerror = () => {
    portrait.src = fallbackPath;
  };
  probe.src = preferredPath;
}

function initVoiceUi() {
  const stored = loadFromStorage(STORAGE_VOICE_CASE_KEY, { caseText: "" });
  if (typeof stored.caseText === "string" && stored.caseText) {
    refs.voiceCaseInput.value = stored.caseText.slice(0, MAX_VOICE_CASE_LENGTH);
  }
  const storedSelection = loadFromStorage(STORAGE_VOICE_CASE_SELECTION_KEY, {
    selection: VOICE_CASE_DEFAULT
  });
  if (typeof storedSelection.selection === "string" && storedSelection.selection) {
    state.voiceCaseSelection = storedSelection.selection;
  }
  const storedMode = loadFromStorage(STORAGE_VOICE_MODE_KEY, {
    mode: VOICE_MODE_QUESTION
  });
  if (typeof storedMode.mode === "string") {
    state.voiceMode = normalizeVoiceMode(storedMode.mode);
  }
  const storedModel = loadFromStorage(STORAGE_VOICE_MODEL_KEY, {
    model: DEFAULT_VOICE_CHAT_MODEL
  });
  if (typeof storedModel.model === "string") {
    state.voiceModel = normalizeVoiceModel(storedModel.model);
  }
  if (refs.voiceDoctorLetterInput && !refs.voiceDoctorLetterInput.value.trim()) {
    refs.voiceDoctorLetterInput.value = DOCTOR_LETTER_TEMPLATE;
  }
  clearDoctorLetterEvaluationReport();
  clearVoiceDoctorConversationEvaluationReport();
  refs.voiceDoctorLetterToggleBtn?.setAttribute("aria-expanded", "false");
  refs.voiceCaseInfoToggleBtn?.setAttribute("aria-expanded", "false");
  refs.voicePromptConfigToggleBtn?.setAttribute("aria-expanded", "false");
  applyVoiceSampleView(state.voiceSampleView, { preserveStatus: true });
  renderPromptConfigEditor();
  renderPromptPresetSelects();
  renderPromptProposalMetaEditor();
  setPromptProposalStatus("");
  renderVoiceModelSelect();
  applyVoiceModelSelection(state.voiceModel, { preserveStatus: true });
  renderVoiceCaseSelect();
  applyVoiceMode(state.voiceMode, { preserveStatus: true });
  applyVoiceCaseSelection(state.voiceCaseSelection, { preserveStatus: true, resetConversation: false });
  renderApiSpendTracker();
  updateVoiceRealtimeUi();
  setVoiceBusy(false);
  updateVoiceCaseInfoPanel();
  void ensureVoiceCaseLibraryLoaded();
  void ensureVoiceCaseResolutionLibraryLoaded();
  void ensureVoiceCaseSampleLibraryLoaded();
  void loadPromptPresetOptions({ silent: true });

  if (!isVoiceCaptureSupported()) {
    refs.voiceRecordBtn.disabled = true;
    setVoiceStatus("Mikrofon-Aufnahme wird auf diesem Geraet/Browser nicht unterstuetzt. Textmodus bleibt aktiv.");
    return;
  }

  setVoiceStatus(buildVoiceReadyStatus());
}

function handleVoiceCaseInput() {
  const normalized = refs.voiceCaseInput.value.slice(0, MAX_VOICE_CASE_LENGTH);
  if (normalized !== refs.voiceCaseInput.value) {
    refs.voiceCaseInput.value = normalized;
  }
  saveToStorage(STORAGE_VOICE_CASE_KEY, { caseText: refs.voiceCaseInput.value });
  updateVoiceCaseInfoPanel();
  if (getActiveVoiceCaseSelection() === VOICE_CASE_CUSTOM) {
    updateVoiceCaseResolution();
  }
}

function openVoiceInfoModal() {
  if (!refs.voiceInfoModal) return;
  refs.voiceInfoModal.classList.remove("hidden");
  refs.voiceInfoBtn?.setAttribute("aria-expanded", "true");
}

function closeVoiceInfoModal() {
  if (!refs.voiceInfoModal) return;
  refs.voiceInfoModal.classList.add("hidden");
  refs.voiceInfoBtn?.setAttribute("aria-expanded", "false");
}

function handleVoiceCreateCase() {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann einen neuen Fall erstellen.", true);
    return;
  }
  if (state.voiceRecording) {
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann einen neuen Fall erstellen.", true);
    return;
  }

  const currentValue = String(refs.voiceCaseInput?.value || "");
  const rawInput = window.prompt(
    "Neuen Falltext einfügen (max. 8000 Zeichen):",
    currentValue
  );
  if (rawInput === null) return;

  const normalized = rawInput.trim().slice(0, MAX_VOICE_CASE_LENGTH);
  if (!normalized) {
    setVoiceStatus("Leerer Falltext wurde nicht uebernommen.", true);
    return;
  }

  refs.voiceCaseInput.value = normalized;
  saveToStorage(STORAGE_VOICE_CASE_KEY, { caseText: normalized });
  applyVoiceCaseSelection(VOICE_CASE_CUSTOM, { preserveStatus: true, resetConversation: true });
  applyVoiceMode(VOICE_MODE_QUESTION, { preserveStatus: true });
  setVoiceStatus("Eigener Fall aktiv. Du kannst direkt fragen oder aufnehmen.");
}

function handleVoiceDiagnoseToggle() {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den Modus wechseln.", true);
    return;
  }
  if (state.voiceRecording) {
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann den Modus wechseln.", true);
    return;
  }
  const nextMode = isDiagnosisMode() ? VOICE_MODE_QUESTION : VOICE_MODE_DIAGNOSIS;
  applyVoiceMode(nextMode, { preserveStatus: false });
}

function handleVoicePatientConversationActivate() {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den Modus wechseln.", true);
    return;
  }
  if (state.voiceRecording) {
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann den Modus wechseln.", true);
    return;
  }
  applyVoiceMode(VOICE_MODE_QUESTION, { preserveStatus: false });
}

function handleVoiceDoctorConversationToggle() {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den Modus wechseln.", true);
    return;
  }
  if (state.voiceRecording) {
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann den Modus wechseln.", true);
    return;
  }
  const nextMode = isDoctorConversationMode() ? VOICE_MODE_QUESTION : VOICE_MODE_DOCTOR_CONVERSATION;
  applyVoiceMode(nextMode, { preserveStatus: false });
}

function normalizeVoiceSampleView(value) {
  if (typeof value !== "string") return "";
  return Object.prototype.hasOwnProperty.call(VOICE_SAMPLE_VIEW_MAP, value) ? value : "";
}

function applyVoiceSampleView(view, options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  state.voiceSampleView = normalizeVoiceSampleView(view);
  updateVoiceSampleButtons();
  updateVoiceSamplePanel();
  if (!preserveStatus) {
    setVoiceStatus(buildVoiceReadyStatus());
  }
}

function updateVoiceSampleButtons() {
  for (const [viewKey, config] of Object.entries(VOICE_SAMPLE_VIEW_MAP)) {
    const button = refs[config.buttonRef];
    if (!button) continue;
    const active = state.voiceSampleView === viewKey;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function handleVoiceSampleToggle(view) {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann in die Musteransicht wechseln.", true);
    return;
  }
  if (state.voiceRecording) {
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann den Modus wechseln.", true);
    return;
  }
  const normalized = normalizeVoiceSampleView(view);
  const nextView = state.voiceSampleView === normalized ? "" : normalized;
  if (nextView && !state.voiceCaseSamplesLoaded) {
    void ensureVoiceCaseSampleLibraryLoaded();
  }
  applyVoiceSampleView(nextView, { preserveStatus: false });
}

function updateVoiceSamplePanel() {
  if (!refs.voiceSamplePanel || !refs.voiceSampleTitle || !refs.voiceSampleMeta || !refs.voiceSampleText) return;

  const activeView = normalizeVoiceSampleView(state.voiceSampleView);
  if (!activeView) {
    refs.voiceSamplePanel.classList.add("hidden");
    refs.voiceSampleTitle.textContent = "Musteransicht";
    refs.voiceSampleMeta.textContent = "";
    refs.voiceSampleText.textContent = "";
    return;
  }

  const sampleConfig = VOICE_SAMPLE_VIEW_MAP[activeView];
  const activeCaseId = getActiveVoiceCaseId();
  refs.voiceSamplePanel.classList.remove("hidden");
  refs.voiceSampleTitle.textContent = sampleConfig.title;
  refs.voiceSampleMeta.textContent = activeCaseId ? `CASE_ID: ${activeCaseId}` : "Kein CASE_ID erkannt.";

  if (!state.voiceCaseSamplesLoaded) {
    refs.voiceSampleText.textContent = "Mustertext wird geladen ...";
    return;
  }

  const caseEntry =
    activeCaseId && state.voiceCaseSamples && typeof state.voiceCaseSamples === "object"
      ? state.voiceCaseSamples[activeCaseId]
      : null;
  const text =
    caseEntry && typeof caseEntry[sampleConfig.field] === "string"
      ? String(caseEntry[sampleConfig.field]).trim()
      : "";
  refs.voiceSampleText.textContent = text
    ? formatVoiceSampleTextForDisplay(text)
    : "Fuer diesen Fall ist hier noch kein Muster hinterlegt.";
}

function formatVoiceSampleTextForDisplay(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const out = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^Turn\s+\d+\s*-\s*/i, "");
    const isSpeakerLine = /^(Arzt|Patient|Patientin|Prueferarzt|Kandidat|Kandidatin):/.test(line);

    if (isSpeakerLine && out.length > 0 && out[out.length - 1].trim() !== "") {
      out.push("");
    }

    out.push(line);
  }

  return out.join("\n").trim();
}

function handleVoiceCaseInfoToggle() {
  if (!refs.voiceCaseInfoPanel || !refs.voiceCaseInfoToggleBtn) return;
  const willOpen = refs.voiceCaseInfoPanel.classList.contains("hidden");
  refs.voiceCaseInfoPanel.classList.toggle("hidden");
  refs.voiceCaseInfoToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  if (willOpen) {
    updateVoiceCaseInfoPanel();
  }
}

function handlePromptConfigToggle() {
  if (!refs.voicePromptConfigPanel || !refs.voicePromptConfigToggleBtn) return;
  const willOpen = refs.voicePromptConfigPanel.classList.contains("hidden");
  refs.voicePromptConfigPanel.classList.toggle("hidden");
  refs.voicePromptConfigToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  if (willOpen) {
    renderPromptConfigEditor();
    renderPromptPresetSelects();
    renderPromptProposalMetaEditor();
  }
}

function handlePromptConfigSave() {
  if (state.voiceBusy) {
    setVoiceStatus("Bitte warte, bis die laufende Anfrage abgeschlossen ist.", true);
    return;
  }
  state.promptConfig = readPromptConfigFromEditor();
  saveToStorage(STORAGE_PROMPT_CONFIG_KEY, state.promptConfig);
  renderPromptConfigEditor();
  setVoiceStatus("Prompt-Aenderungen gespeichert.");
}

function handlePromptConfigReset() {
  if (state.voiceBusy) {
    setVoiceStatus("Bitte warte, bis die laufende Anfrage abgeschlossen ist.", true);
    return;
  }
  const confirmed = window.confirm("Alle Prompt-Texte auf Standard zuruecksetzen?");
  if (!confirmed) return;
  state.promptConfig = resolvePromptConfig({});
  saveToStorage(STORAGE_PROMPT_CONFIG_KEY, state.promptConfig);
  renderPromptConfigEditor();
  setVoiceStatus("Alle Prompts wurden auf Standard zurueckgesetzt.");
}

function renderPromptConfigEditor() {
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const refKey = PROMPT_EDITOR_REF_KEY_BY_PROMPT_KEY[promptKey];
    const input = refs[refKey];
    if (!input) continue;
    input.value = getPromptForKey(promptKey);
  }
}

function readPromptConfigFromEditor() {
  const next = {};
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const refKey = PROMPT_EDITOR_REF_KEY_BY_PROMPT_KEY[promptKey];
    const input = refs[refKey];
    const raw = typeof input?.value === "string" ? input.value : "";
    next[promptKey] = normalizePromptText(raw, DEFAULT_PROMPT_CONFIG[promptKey]);
  }
  return next;
}

function resolvePromptConfig(rawValue) {
  const source = rawValue && typeof rawValue === "object" ? rawValue : {};
  const resolved = {};
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const normalized = normalizePromptText(source[promptKey], DEFAULT_PROMPT_CONFIG[promptKey]);
    resolved[promptKey] =
      promptKey === "voiceDoctorEvaluate"
        ? upgradeDoctorEvaluatePromptIfNeeded(normalized)
        : normalized;
  }
  return resolved;
}

function upgradeDoctorEvaluatePromptIfNeeded(promptText) {
  const normalized = normalizePromptText(promptText, DEFAULT_PROMPT_CONFIG.voiceDoctorEvaluate);
  const hasDetailedField = normalized.includes("detailed_feedback_text");
  if (hasDetailedField) {
    return normalized;
  }
  const upgraded = `${normalized}\n${DOCTOR_EVAL_REQUIRED_PROMPT_BLOCK}`.trim();
  return upgraded.slice(0, MAX_PROMPT_TEXT_LENGTH);
}

function normalizePromptText(value, fallback) {
  const fallbackText = typeof fallback === "string" ? fallback : "";
  if (typeof value !== "string") return fallbackText;
  const trimmed = value.trim();
  if (!trimmed) return fallbackText;
  return trimmed.slice(0, MAX_PROMPT_TEXT_LENGTH);
}

function createApiSpendTrackerSnapshot() {
  return {
    updatedAt: new Date().toISOString(),
    realtimeSessions: 0,
    realtimeTurnsTracked: 0,
    totalUsd: 0,
    textInputTokens: 0,
    textCachedInputTokens: 0,
    textOutputTokens: 0,
    audioInputTokens: 0,
    audioCachedInputTokens: 0,
    audioOutputTokens: 0
  };
}

function normalizeApiSpendNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric < 0 ? 0 : numeric;
}

function resolveApiSpendTracker(rawValue) {
  const source = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    updatedAt:
      typeof source.updatedAt === "string" && source.updatedAt.trim()
        ? source.updatedAt.trim()
        : new Date().toISOString(),
    realtimeSessions: Math.floor(normalizeApiSpendNumber(source.realtimeSessions)),
    realtimeTurnsTracked: Math.floor(normalizeApiSpendNumber(source.realtimeTurnsTracked)),
    totalUsd: normalizeApiSpendNumber(source.totalUsd),
    textInputTokens: Math.floor(normalizeApiSpendNumber(source.textInputTokens)),
    textCachedInputTokens: Math.floor(normalizeApiSpendNumber(source.textCachedInputTokens)),
    textOutputTokens: Math.floor(normalizeApiSpendNumber(source.textOutputTokens)),
    audioInputTokens: Math.floor(normalizeApiSpendNumber(source.audioInputTokens)),
    audioCachedInputTokens: Math.floor(normalizeApiSpendNumber(source.audioCachedInputTokens)),
    audioOutputTokens: Math.floor(normalizeApiSpendNumber(source.audioOutputTokens))
  };
}

function saveApiSpendTracker() {
  saveToStorage(STORAGE_API_SPEND_TRACKER_KEY, state.apiSpendTracker);
}

function formatUsdAmount(value) {
  return normalizeApiSpendNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
}

function formatTokenAmount(value) {
  return Math.floor(normalizeApiSpendNumber(value)).toLocaleString("de-DE");
}

function buildApiSpendTokenSummary(tracker) {
  if (!tracker.realtimeTurnsTracked) {
    return "Noch keine Realtime-Nutzung erfasst.";
  }
  return [
    `Turns: ${formatTokenAmount(tracker.realtimeTurnsTracked)}`,
    `Text in/out: ${formatTokenAmount(tracker.textInputTokens)} / ${formatTokenAmount(
      tracker.textOutputTokens
    )}`,
    `Audio in/out: ${formatTokenAmount(tracker.audioInputTokens)} / ${formatTokenAmount(
      tracker.audioOutputTokens
    )}`,
    `Cached in: Text ${formatTokenAmount(tracker.textCachedInputTokens)}, Audio ${formatTokenAmount(
      tracker.audioCachedInputTokens
    )}`
  ].join(" | ");
}

function renderApiSpendTracker() {
  if (!refs.voiceApiSpendSummary || !refs.voiceApiSpendTokens) return;
  const tracker = resolveApiSpendTracker(state.apiSpendTracker);
  state.apiSpendTracker = tracker;
  refs.voiceApiSpendSummary.textContent = `${formatUsdAmount(tracker.totalUsd)} USD`;
  refs.voiceApiSpendTokens.textContent = buildApiSpendTokenSummary(tracker);
}

function handleApiSpendTrackerReset() {
  const confirmed = window.confirm("API Kosten-Tracker wirklich zuruecksetzen?");
  if (!confirmed) return;
  state.apiSpendTracker = createApiSpendTrackerSnapshot();
  saveApiSpendTracker();
  renderApiSpendTracker();
  setVoiceStatus("API Kosten-Tracker wurde zurueckgesetzt.");
}

function getRealtimePricingForModel(model) {
  const normalizedModel =
    model === OPENAI_REALTIME_MODEL_STRONG ? OPENAI_REALTIME_MODEL_STRONG : OPENAI_REALTIME_MODEL_FAST;
  return (
    OPENAI_REALTIME_PRICING_USD_PER_1M[normalizedModel] ||
    OPENAI_REALTIME_PRICING_USD_PER_1M[OPENAI_REALTIME_MODEL_FAST]
  );
}

function normalizeRealtimeUsageTokens(rawUsage) {
  const source = rawUsage && typeof rawUsage === "object" ? rawUsage : {};
  const inputDetails =
    source.input_token_details && typeof source.input_token_details === "object"
      ? source.input_token_details
      : {};
  const outputDetails =
    source.output_token_details && typeof source.output_token_details === "object"
      ? source.output_token_details
      : {};

  const inputTotal = Math.floor(normalizeApiSpendNumber(source.input_tokens));
  const outputTotal = Math.floor(normalizeApiSpendNumber(source.output_tokens));
  const textInputFromDetails = Math.floor(normalizeApiSpendNumber(inputDetails.text_tokens));
  const audioInputFromDetails = Math.floor(normalizeApiSpendNumber(inputDetails.audio_tokens));
  const textOutputFromDetails = Math.floor(normalizeApiSpendNumber(outputDetails.text_tokens));
  const audioOutputFromDetails = Math.floor(normalizeApiSpendNumber(outputDetails.audio_tokens));

  const textCachedInputTokens = Math.floor(
    normalizeApiSpendNumber(inputDetails.cached_text_tokens ?? inputDetails.cached_tokens)
  );
  const audioCachedInputTokens = Math.floor(normalizeApiSpendNumber(inputDetails.cached_audio_tokens));

  const textInputTokens = textInputFromDetails || (inputTotal ? inputTotal : 0);
  const audioInputTokens = audioInputFromDetails || 0;
  const textOutputTokens = textOutputFromDetails || (outputTotal ? outputTotal : 0);
  const audioOutputTokens = audioOutputFromDetails || 0;

  return {
    textInputTokens,
    textCachedInputTokens,
    textOutputTokens,
    audioInputTokens,
    audioCachedInputTokens,
    audioOutputTokens
  };
}

function calculateRealtimeUsageCostUsd(model, usageTokens) {
  const pricing = getRealtimePricingForModel(model);
  const textInputBillable = Math.max(usageTokens.textInputTokens - usageTokens.textCachedInputTokens, 0);
  const audioInputBillable = Math.max(usageTokens.audioInputTokens - usageTokens.audioCachedInputTokens, 0);
  const perMillion = 1_000_000;
  return (
    (textInputBillable / perMillion) * pricing.textInput +
    (usageTokens.textCachedInputTokens / perMillion) * pricing.textCachedInput +
    (usageTokens.textOutputTokens / perMillion) * pricing.textOutput +
    (audioInputBillable / perMillion) * pricing.audioInput +
    (usageTokens.audioCachedInputTokens / perMillion) * pricing.audioCachedInput +
    (usageTokens.audioOutputTokens / perMillion) * pricing.audioOutput
  );
}

function extractRealtimeUsageFingerprint(eventPayload) {
  const responseId = safeLine(eventPayload?.response?.id || eventPayload?.response_id || "", 120);
  if (responseId) return responseId;
  const eventId = safeLine(eventPayload?.event_id || eventPayload?.id || "", 120);
  if (eventId) return eventId;
  return "";
}

function trackRealtimeSessionStart(model) {
  const next = resolveApiSpendTracker(state.apiSpendTracker);
  next.realtimeSessions += 1;
  next.updatedAt = new Date().toISOString();
  state.apiSpendTracker = next;
  state.voiceRealtimeModel =
    model === OPENAI_REALTIME_MODEL_STRONG ? OPENAI_REALTIME_MODEL_STRONG : OPENAI_REALTIME_MODEL_FAST;
  saveApiSpendTracker();
  renderApiSpendTracker();
}

function trackRealtimeUsageFromEvent(eventPayload) {
  const usage = eventPayload?.response?.usage;
  if (!usage || typeof usage !== "object") return;
  const fingerprint = extractRealtimeUsageFingerprint(eventPayload);
  if (fingerprint && realtimeUsageSeenResponseIds.has(fingerprint)) {
    return;
  }
  if (fingerprint) {
    realtimeUsageSeenResponseIds.add(fingerprint);
    if (realtimeUsageSeenResponseIds.size > 300) {
      const iterator = realtimeUsageSeenResponseIds.values();
      const oldest = iterator.next().value;
      if (oldest) {
        realtimeUsageSeenResponseIds.delete(oldest);
      }
    }
  }

  const usageTokens = normalizeRealtimeUsageTokens(usage);
  const next = resolveApiSpendTracker(state.apiSpendTracker);
  next.realtimeTurnsTracked += 1;
  next.textInputTokens += usageTokens.textInputTokens;
  next.textCachedInputTokens += usageTokens.textCachedInputTokens;
  next.textOutputTokens += usageTokens.textOutputTokens;
  next.audioInputTokens += usageTokens.audioInputTokens;
  next.audioCachedInputTokens += usageTokens.audioCachedInputTokens;
  next.audioOutputTokens += usageTokens.audioOutputTokens;
  next.totalUsd += calculateRealtimeUsageCostUsd(state.voiceRealtimeModel, usageTokens);
  next.updatedAt = new Date().toISOString();

  state.apiSpendTracker = next;
  saveApiSpendTracker();
  renderApiSpendTracker();
}

function safeLine(value, maxLength = 200) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.slice(0, Math.max(0, maxLength));
}

function safeParagraph(value, maxLength = 600) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.slice(0, Math.max(0, maxLength));
}

function getPromptForKey(promptKey) {
  return normalizePromptText(state.promptConfig?.[promptKey], DEFAULT_PROMPT_CONFIG[promptKey]);
}

function createEmptyPromptPresetOptions() {
  const options = {};
  for (const key of PROMPT_FIELD_KEYS) {
    options[key] = [];
  }
  return options;
}

function renderPromptPresetSelects() {
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const selectRefKey = PROMPT_PRESET_SELECT_REF_KEY_BY_PROMPT_KEY[promptKey];
    const select = refs[selectRefKey];
    if (!select) continue;

    const presets = Array.isArray(state.promptPresetOptionsByKey?.[promptKey])
      ? state.promptPresetOptionsByKey[promptKey]
      : [];

    select.innerHTML = "";
    addPromptPresetSelectOption(select, "", "Gespeicherten Prompt auswaehlen ...");
    addPromptPresetSelectOption(select, "__default__", "Standard-Default laden");

    for (const option of presets) {
      addPromptPresetSelectOption(
        select,
        String(option?.value || ""),
        String(option?.label || "Prompt")
      );
    }

    select.value = "";
  }
}

function addPromptPresetSelectOption(select, value, label) {
  if (!select) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function buildPromptPresetOptionLabel(row, fallbackLabel) {
  const proposalName = safeLine(row?.proposal_name || "", 90);
  const createdAtRaw = typeof row?.created_at === "string" ? row.created_at : "";
  let dateLabel = "";
  if (createdAtRaw) {
    const parsed = new Date(createdAtRaw);
    if (!Number.isNaN(parsed.valueOf())) {
      dateLabel = parsed.toLocaleDateString("de-DE");
    }
  }
  const adopted = Boolean(row?.direct_adopt_applied);
  const adoptedSuffix = adopted ? " [uebernommen]" : "";
  if (proposalName && dateLabel) {
    return `${proposalName} (${dateLabel})${adoptedSuffix}`;
  }
  if (proposalName) {
    return `${proposalName}${adoptedSuffix}`;
  }
  if (dateLabel) {
    return `${fallbackLabel} (${dateLabel})${adoptedSuffix}`;
  }
  return `${fallbackLabel}${adoptedSuffix}`;
}

function extractPromptTextFromSubmission(row, promptKey) {
  if (!row || typeof row !== "object") return "";
  const targetKey = normalizePromptProposalTarget(String(row.target_prompt_key || ""));
  if (targetKey === promptKey) {
    return normalizePromptText(row.prompt_text, "");
  }
  if (targetKey === PROMPT_FEEDBACK_TARGET_ALL) {
    const payload = parsePromptPayloadObject(row.prompt_payload_json);
    if (payload) {
      return normalizePromptText(payload[promptKey], "");
    }
    return "";
  }
  return "";
}

function parsePromptPayloadObject(rawValue) {
  if (rawValue && typeof rawValue === "object") {
    return rawValue;
  }
  if (typeof rawValue !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function handlePromptPresetSelectChange(promptKey) {
  const selectRefKey = PROMPT_PRESET_SELECT_REF_KEY_BY_PROMPT_KEY[promptKey];
  const inputRefKey = PROMPT_EDITOR_REF_KEY_BY_PROMPT_KEY[promptKey];
  const select = refs[selectRefKey];
  const input = refs[inputRefKey];
  if (!select || !input) return;

  const selectedValue = String(select.value || "");
  if (!selectedValue) return;

  let nextPromptText = "";
  let sourceLabel = "";

  if (selectedValue === "__default__") {
    nextPromptText = DEFAULT_PROMPT_CONFIG[promptKey];
    sourceLabel = "Standard-Default";
  } else {
    const presets = Array.isArray(state.promptPresetOptionsByKey?.[promptKey])
      ? state.promptPresetOptionsByKey[promptKey]
      : [];
    const selectedPreset = presets.find((item) => String(item?.value || "") === selectedValue);
    if (!selectedPreset) {
      select.value = "";
      return;
    }
    nextPromptText = normalizePromptText(selectedPreset.promptText, DEFAULT_PROMPT_CONFIG[promptKey]);
    sourceLabel = String(selectedPreset.label || "Prompt-Auswahl");
  }

  input.value = nextPromptText;
  state.promptConfig = resolvePromptConfig({
    ...state.promptConfig,
    [promptKey]: nextPromptText
  });
  saveToStorage(STORAGE_PROMPT_CONFIG_KEY, state.promptConfig);
  if (refs.voicePromptProposalTargetSelect) {
    refs.voicePromptProposalTargetSelect.value = promptKey;
    handlePromptProposalMetaInput();
  }
  setPromptProposalStatus(`Auswahl geladen: ${sourceLabel}`);
  setVoiceStatus(`Prompt geladen: ${PROMPT_LABEL_BY_KEY[promptKey] || promptKey}`);
  select.value = "";
}

async function loadPromptPresetOptions(options = {}) {
  const silent = Boolean(options.silent);
  if (!supabase || !state.user) {
    state.promptPresetOptionsByKey = createEmptyPromptPresetOptions();
    renderPromptPresetSelects();
    return;
  }

  const nextOptions = createEmptyPromptPresetOptions();

  try {
    const payload = await runPromptProposalApiRequest("GET", {
      query: `limit=${PROMPT_PRESET_QUERY_LIMIT}`,
      stageLabel: "Prompt-Auswahl laden"
    });
    const profileRows = Array.isArray(payload?.profiles) ? payload.profiles : [];
    const submissionRows = Array.isArray(payload?.submissions) ? payload.submissions : [];

    for (const row of profileRows) {
      const promptKey = String(row?.prompt_key || "");
      if (!PROMPT_FIELD_KEYS.includes(promptKey)) continue;
      const promptText = normalizePromptText(row?.prompt_text, "");
      if (!promptText) continue;
      const version = Number.isFinite(Number(row?.version)) ? Number(row.version) : 1;
      nextOptions[promptKey].push({
        value: `profile:${promptKey}:v${version}`,
        label: `Global aktiv v${version}`,
        promptText
      });
    }

    for (const row of submissionRows) {
      for (const promptKey of PROMPT_FIELD_KEYS) {
        const promptText = extractPromptTextFromSubmission(row, promptKey);
        if (!promptText) continue;
        const submissionId = safeLine(String(row?.id || ""), 80);
        if (!submissionId) continue;
        nextOptions[promptKey].push({
          value: `submission:${submissionId}:${promptKey}`,
          label: buildPromptPresetOptionLabel(row, "Vorschlag"),
          promptText
        });
      }
    }

    for (const promptKey of PROMPT_FIELD_KEYS) {
      const seenValues = new Set();
      nextOptions[promptKey] = nextOptions[promptKey].filter((entry) => {
        const valueKey = String(entry?.value || "");
        if (!valueKey) return false;
        if (seenValues.has(valueKey)) return false;
        seenValues.add(valueKey);
        return true;
      });
    }

    state.promptPresetOptionsByKey = nextOptions;
    renderPromptPresetSelects();
  } catch (error) {
    // Keep existing preset options (including freshly submitted local entries)
    // if background reloading from Supabase fails.
    renderPromptPresetSelects();
    if (!silent) {
      const dbError = normalizeDbError(error);
      const message = buildPromptProposalErrorMessage(dbError, "Prompt-Auswahl laden");
      setPromptProposalStatus(message, true);
    }
    console.error(error);
  }
}

function normalizePromptProposalTarget(value) {
  if (value === PROMPT_FEEDBACK_TARGET_ALL) return PROMPT_FEEDBACK_TARGET_ALL;
  return PROMPT_FIELD_KEYS.includes(value) ? value : "voiceDoctorTurn";
}

function resolvePromptProposalMeta(rawValue) {
  const source = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    name: normalizePromptProposalName(source.name),
    note: normalizePromptProposalNote(source.note),
    target: normalizePromptProposalTarget(source.target),
    applyNow: Boolean(source.applyNow)
  };
}

function normalizePromptProposalName(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_PROMPT_PROPOSAL_NAME_LENGTH);
}

function normalizePromptProposalNote(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_PROMPT_PROPOSAL_NOTE_LENGTH);
}

function renderPromptProposalMetaEditor() {
  if (refs.voicePromptProposalNameInput) {
    refs.voicePromptProposalNameInput.value = state.promptProposalMeta?.name || "";
  }
  if (refs.voicePromptProposalNoteInput) {
    refs.voicePromptProposalNoteInput.value = state.promptProposalMeta?.note || "";
  }
  if (refs.voicePromptProposalTargetSelect) {
    refs.voicePromptProposalTargetSelect.value =
      normalizePromptProposalTarget(state.promptProposalMeta?.target) || "voiceDoctorTurn";
  }
  if (refs.voicePromptProposalApplyNowInput) {
    refs.voicePromptProposalApplyNowInput.checked = Boolean(state.promptProposalMeta?.applyNow);
  }
}

function handlePromptProposalMetaInput() {
  state.promptProposalMeta = {
    name: normalizePromptProposalName(refs.voicePromptProposalNameInput?.value || ""),
    note: normalizePromptProposalNote(refs.voicePromptProposalNoteInput?.value || ""),
    target: normalizePromptProposalTarget(refs.voicePromptProposalTargetSelect?.value || ""),
    applyNow: Boolean(refs.voicePromptProposalApplyNowInput?.checked)
  };
  saveToStorage(STORAGE_PROMPT_PROPOSAL_META_KEY, state.promptProposalMeta);
}

function setPromptProposalStatus(message, isError = false) {
  if (!refs.voicePromptProposalStatus) return;
  refs.voicePromptProposalStatus.textContent = String(message || "");
  refs.voicePromptProposalStatus.classList.toggle("error", Boolean(isError));
}

async function runSupabaseWithTimeout(queryOrPromise, stageLabel, timeoutMs = SUPABASE_REQUEST_TIMEOUT_MS) {
  let timeoutId = null;
  const hasAbortController = typeof AbortController !== "undefined";
  const canAbort = Boolean(queryOrPromise && typeof queryOrPromise.abortSignal === "function");
  const controller = hasAbortController && canAbort ? new AbortController() : null;
  const request = controller ? queryOrPromise.abortSignal(controller.signal) : queryOrPromise;
  const executionPromise = Promise.resolve(request);

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      if (controller) {
        try {
          controller.abort();
        } catch {
          // ignore
        }
      }
      reject({
        code: "TIMEOUT",
        message: `Zeitlimit ueberschritten (${Math.round(timeoutMs / 1000)}s)`,
        details: stageLabel
      });
    }, timeoutMs);
  });

  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function getSupabaseAccessToken() {
  if (!supabase) {
    throw { code: "NO_SUPABASE", message: "Supabase ist nicht initialisiert." };
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  const accessToken = String(data?.session?.access_token || "");
  if (!accessToken) {
    throw { code: "NO_SESSION", message: "Keine aktive Supabase-Session." };
  }
  return accessToken;
}

async function runPromptProposalApiRequest(method, options = {}) {
  const upperMethod = String(method || "GET").toUpperCase();
  const stageLabel = String(options.stageLabel || "Prompt-API");
  const query = String(options.query || "").trim();
  const body = options.body;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : PROMPT_API_TIMEOUT_MS;
  const accessToken = await getSupabaseAccessToken();
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

  let timeoutId = null;
  if (controller) {
    timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  try {
    const url = `/api/prompt-proposals${query ? `?${query}` : ""}`;
    const headers = {
      authorization: `Bearer ${accessToken}`
    };
    if (upperMethod !== "GET") {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(url, {
      method: upperMethod,
      headers,
      body: upperMethod === "GET" ? undefined : JSON.stringify(body || {}),
      signal: controller ? controller.signal : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw {
        code: safeLine(payload?.code || `HTTP_${response.status}`, 40),
        message: safeParagraph(
          payload?.error || response.statusText || `${stageLabel} fehlgeschlagen.`,
          600
        ),
        details: safeParagraph(payload?.details, 600),
        hint: safeParagraph(payload?.hint, 400)
      };
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw {
        code: "TIMEOUT",
        message: `Zeitlimit ueberschritten (${Math.round(timeoutMs / 1000)}s)`,
        details: stageLabel
      };
    }
    throw error;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

function normalizeDbError(error) {
  if (error && typeof error === "object") {
    return {
      code: safeLine(error.code, 40),
      message: safeParagraph(error.message || error.error_description, 600),
      details: safeParagraph(error.details, 600),
      hint: safeParagraph(error.hint, 400)
    };
  }
  const fallback = safeParagraph(String(error || ""), 600);
  return { code: "", message: fallback, details: "", hint: "" };
}

function isSchemaMissingDbError(dbError) {
  const full = `${dbError.code} ${dbError.message} ${dbError.details} ${dbError.hint}`.toLowerCase();
  return (
    dbError.code === "42P01" ||
    dbError.code === "PGRST205" ||
    full.includes("does not exist") ||
    full.includes("schema cache") ||
    full.includes("could not find the table") ||
    full.includes("relation")
  );
}

function isPermissionDbError(dbError) {
  const full = `${dbError.code} ${dbError.message} ${dbError.details} ${dbError.hint}`.toLowerCase();
  return (
    dbError.code === "42501" ||
    full.includes("permission denied") ||
    full.includes("row-level security") ||
    full.includes("rls")
  );
}

function buildPromptProposalErrorMessage(dbError, stageLabel) {
  if (dbError.code === "TIMEOUT") {
    return `Zeitueberschreitung bei "${stageLabel}". Bitte Netzwerk/Supabase pruefen und erneut senden.`;
  }
  if (isSchemaMissingDbError(dbError)) {
    return `Tabellen fehlen. Bitte /supabase/prompt_feedback.sql in Supabase ausfuehren. (${stageLabel})`;
  }
  if (isPermissionDbError(dbError)) {
    return `Keine Berechtigung in Supabase (${stageLabel}). Bitte RLS/Policies fuer prompt_feedback/prompt_profiles pruefen.`;
  }
  const readableParts = [];
  if (dbError.code) readableParts.push(`Code ${dbError.code}`);
  if (dbError.message) readableParts.push(dbError.message);
  if (dbError.details) readableParts.push(dbError.details);
  if (dbError.hint) readableParts.push(`Hinweis: ${dbError.hint}`);
  const readable = safeParagraph(readableParts.join(" | "), 420);
  if (readable) {
    return `${stageLabel} fehlgeschlagen: ${readable}`;
  }
  return `${stageLabel} fehlgeschlagen.`;
}

function getPromptProposalKeys(target) {
  if (target === PROMPT_FEEDBACK_TARGET_ALL) {
    return [...PROMPT_FIELD_KEYS];
  }
  return [normalizePromptProposalTarget(target)];
}

function buildPromptPayloadJson(promptKeys, promptSourceConfig = null) {
  const payload = {};
  for (const key of promptKeys) {
    const sourceValue =
      promptSourceConfig && typeof promptSourceConfig === "object"
        ? promptSourceConfig[key]
        : state.promptConfig?.[key];
    payload[key] = normalizePromptText(sourceValue, DEFAULT_PROMPT_CONFIG[key]);
  }
  return payload;
}

function buildPromptSubmissionText(target, promptKeys, promptPayload = null) {
  const payload = promptPayload || buildPromptPayloadJson(promptKeys);
  if (target !== PROMPT_FEEDBACK_TARGET_ALL && promptKeys.length === 1) {
    return normalizePromptText(payload[promptKeys[0]], "");
  }
  return JSON.stringify(payload, null, 2).slice(0, MAX_PROMPT_TEXT_LENGTH);
}

function mergePromptPresetFromSubmission(entry) {
  if (!entry || typeof entry !== "object") return;
  const submissionId = safeLine(String(entry.submissionId || ""), 120);
  const target = normalizePromptProposalTarget(String(entry.target || ""));
  const promptPayload = entry.promptPayload && typeof entry.promptPayload === "object" ? entry.promptPayload : {};
  const proposalName = normalizePromptProposalName(String(entry.proposalName || ""));
  const createdAt = typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString();
  const adopted = Boolean(entry.directAdoptApplied);
  if (!submissionId) return;

  const promptKeys = getPromptProposalKeys(target);
  const rowForLabel = {
    proposal_name: proposalName || "Vorschlag",
    created_at: createdAt,
    direct_adopt_applied: adopted
  };

  for (const promptKey of promptKeys) {
    if (!PROMPT_FIELD_KEYS.includes(promptKey)) continue;
    const promptText = normalizePromptText(promptPayload[promptKey], "");
    if (!promptText) continue;
    const optionValue = `submission:${submissionId}:${promptKey}`;
    const optionLabel = buildPromptPresetOptionLabel(rowForLabel, "Vorschlag");
    const existingOptions = Array.isArray(state.promptPresetOptionsByKey?.[promptKey])
      ? state.promptPresetOptionsByKey[promptKey]
      : [];
    const withoutDuplicate = existingOptions.filter((option) => String(option?.value || "") !== optionValue);
    withoutDuplicate.unshift({
      value: optionValue,
      label: optionLabel,
      promptText
    });
    state.promptPresetOptionsByKey[promptKey] = withoutDuplicate;
  }
  renderPromptPresetSelects();
}

async function handlePromptProposalSubmit() {
  if (state.promptProposalBusy) return;
  if (state.voiceBusy) {
    setVoiceStatus("Bitte warte, bis die laufende Anfrage abgeschlossen ist.", true);
    return;
  }
  if (!supabase || !state.user) {
    setVoiceStatus("Bitte zuerst einloggen, um Prompt-Vorschlaege zu senden.", true);
    setPromptProposalStatus("Bitte zuerst einloggen.", true);
    return;
  }

  handlePromptProposalMetaInput();
  const proposalName = normalizePromptProposalName(state.promptProposalMeta?.name || "");
  const proposalNote = normalizePromptProposalNote(state.promptProposalMeta?.note || "");
  const target = normalizePromptProposalTarget(state.promptProposalMeta?.target || "");
  const directAdopt = Boolean(state.promptProposalMeta?.applyNow);
  const promptKeys = getPromptProposalKeys(target);
  const latestPromptConfig = readPromptConfigFromEditor();
  state.promptConfig = resolvePromptConfig(latestPromptConfig);
  saveToStorage(STORAGE_PROMPT_CONFIG_KEY, state.promptConfig);
  const promptPayload = buildPromptPayloadJson(promptKeys, state.promptConfig);
  const targetLabel =
    target === PROMPT_FEEDBACK_TARGET_ALL
      ? "alle 5 Prompts"
      : PROMPT_LABEL_BY_KEY[target] || target;

  if (!proposalName) {
    setVoiceStatus("Bitte gib einen Namen fuer den Prompt-Vorschlag ein.", true);
    setPromptProposalStatus("Name fehlt.", true);
    refs.voicePromptProposalNameInput?.focus();
    return;
  }

  let submissionId = "";
  let submissionCreatedAt = "";
  let stageLabel = "Vorschlag speichern";
  try {
    setPromptProposalBusy(true);
    setPromptProposalStatus("Sende Vorschlag an Supabase ...");
    setVoiceStatus("Prompt-Vorschlag wird gespeichert ...");

    const apiPayload = await runPromptProposalApiRequest("POST", {
      stageLabel,
      timeoutMs: PROMPT_API_TIMEOUT_MS,
      body: {
        proposalName,
        proposalNote,
        targetPromptKey: target,
        promptText: buildPromptSubmissionText(target, promptKeys, promptPayload),
        promptPayloadJson: promptPayload,
        directAdoptRequested: directAdopt
      }
    });
    const submission = apiPayload?.submission || {};
    submissionId = String(submission.id || "");
    submissionCreatedAt = typeof submission.created_at === "string" ? submission.created_at : "";
    const directAdoptApplied = Boolean(apiPayload?.directAdoptApplied);
    mergePromptPresetFromSubmission({
      submissionId,
      target,
      proposalName,
      promptPayload,
      createdAt: submissionCreatedAt,
      directAdoptApplied
    });

    if (directAdoptApplied) {
      await loadPromptPresetOptions({ silent: true });
      setVoiceStatus(`Vorschlag gespeichert und global uebernommen (${targetLabel}).`);
      setPromptProposalStatus(`Gespeichert und global uebernommen (${targetLabel}).`);
    } else {
      setPromptProposalStatus("Vorschlag gespeichert. Aktualisiere Auswahl ...");
      await loadPromptPresetOptions({ silent: true });
      setVoiceStatus(`Prompt-Vorschlag gespeichert (${targetLabel}).`);
      setPromptProposalStatus(`Vorschlag gespeichert (${targetLabel}).`);
    }
  } catch (error) {
    const dbError = normalizeDbError(error);
    const uiMessage = buildPromptProposalErrorMessage(dbError, stageLabel);
    setVoiceStatus(uiMessage, true);
    setPromptProposalStatus(uiMessage, true);
    console.error(error);
  } finally {
    setPromptProposalBusy(false);
  }
}

function handleDoctorLetterToggle() {
  if (!refs.voiceDoctorLetterPanel || !refs.voiceDoctorLetterInput) return;
  const willOpen = refs.voiceDoctorLetterPanel.classList.contains("hidden");
  refs.voiceDoctorLetterPanel.classList.toggle("hidden");
  if (refs.voiceDoctorLetterToggleBtn) {
    refs.voiceDoctorLetterToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }
  if (willOpen && !refs.voiceDoctorLetterInput.value.trim()) {
    refs.voiceDoctorLetterInput.value = DOCTOR_LETTER_TEMPLATE;
  }
  if (willOpen) {
    refs.voiceDoctorLetterInput.focus();
  }
}

async function handleDoctorLetterSubmit() {
  if (state.voiceBusy) return;
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den Arztbrief bewerten.", true);
    return;
  }
  const doctorLetterText = String(refs.voiceDoctorLetterInput?.value || "").trim();
  if (!doctorLetterText) {
    setVoiceStatus("Bitte zuerst den Arztbrief ausfuellen.", true);
    refs.voiceDoctorLetterInput?.focus();
    return;
  }
  if (doctorLetterText.length > MAX_DOCTOR_LETTER_LENGTH) {
    setVoiceStatus(`Arztbrief zu lang (max ${MAX_DOCTOR_LETTER_LENGTH} Zeichen).`, true);
    return;
  }

  try {
    setVoiceBusy(true);
    setVoiceStatus("Arztbrief wird bewertet ...");
    const result = await runDoctorLetterEvaluation(doctorLetterText);
    renderDoctorLetterEvaluationReport(result);
    setVoiceStatus("Arztbrief-Bewertung ist da.");
  } catch (error) {
    setVoiceStatus("Arztbrief-Bewertung fehlgeschlagen. Bitte erneut versuchen.", true);
    console.error(error);
  } finally {
    setVoiceBusy(false);
  }
}

async function handleVoiceDoctorConversationEvaluate() {
  if (state.voiceBusy) return;
  if (state.voiceRecording) {
    setVoiceStatus("Bitte zuerst die laufende Aufnahme stoppen.", true);
    return;
  }
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden und dann bewerten.", true);
    return;
  }
  if (!isDoctorConversationMode()) {
    setVoiceStatus("Bitte zuerst in den Arzt-Arzt-Modus wechseln.", true);
    return;
  }

  const hasConversation = Array.isArray(state.voiceDoctorConversationHistory)
    ? state.voiceDoctorConversationHistory.some(
        (turn) => String(turn?.user || "").trim() || String(turn?.assistant || "").trim()
      )
    : false;
  if (!hasConversation) {
    setVoiceStatus("Bitte zuerst ein Arzt-Arzt-Gespraech fuehren, dann bewerten.", true);
    return;
  }

  try {
    setVoiceBusy(true);
    setVoiceStatus("Arzt-Arzt-Gespraech wird bewertet ...");
    const evaluation = await runVoiceDoctorConversationEvaluation();
    renderVoiceDoctorConversationEvaluationReport(evaluation);
    setVoiceStatus("Arzt-Arzt-Bewertung ist da.");
  } catch (error) {
    setVoiceStatus("Arzt-Arzt-Bewertung fehlgeschlagen. Bitte erneut versuchen.", true);
    console.error(error);
  } finally {
    setVoiceBusy(false);
  }
}

function handleVoiceModelChange() {
  if (!refs.voiceModelSelect) return;
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    refs.voiceModelSelect.value = state.voiceModel;
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann das Modell wechseln.", true);
    return;
  }
  if (state.voiceRecording) {
    refs.voiceModelSelect.value = state.voiceModel;
    setVoiceStatus("Bitte erst die laufende Aufnahme stoppen, dann das Modell wechseln.", true);
    return;
  }
  applyVoiceModelSelection(refs.voiceModelSelect.value, { preserveStatus: false });
}

function handleVoiceCaseSelectionChange() {
  if (!refs.voiceCaseSelect) return;
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    refs.voiceCaseSelect.value = getActiveVoiceCaseSelection();
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den Fall wechseln.", true);
    return;
  }
  applyVoiceCaseSelection(refs.voiceCaseSelect.value, { preserveStatus: false, resetConversation: true });
}

function normalizeVoiceModel(value) {
  if (typeof value !== "string") return DEFAULT_VOICE_CHAT_MODEL;
  return VOICE_MODEL_SET.has(value) ? value : DEFAULT_VOICE_CHAT_MODEL;
}

function renderVoiceModelSelect() {
  if (!refs.voiceModelSelect) return;
  refs.voiceModelSelect.innerHTML = "";
  for (const optionDef of VOICE_MODEL_OPTIONS) {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.label;
    refs.voiceModelSelect.appendChild(option);
  }
}

function getVoiceModelLabel(value) {
  const found = VOICE_MODEL_OPTIONS.find((entry) => entry.value === value);
  return found ? found.label : value;
}

function applyVoiceModelSelection(model, options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  state.voiceModel = normalizeVoiceModel(model);
  if (refs.voiceModelSelect && refs.voiceModelSelect.value !== state.voiceModel) {
    refs.voiceModelSelect.value = state.voiceModel;
  }
  saveToStorage(STORAGE_VOICE_MODEL_KEY, { model: state.voiceModel });
  if (!preserveStatus) {
    setVoiceStatus(buildVoiceReadyStatus());
  }
}

function normalizeVoiceMode(mode) {
  if (mode === VOICE_MODE_DIAGNOSIS) return VOICE_MODE_DIAGNOSIS;
  if (mode === VOICE_MODE_DOCTOR_CONVERSATION) return VOICE_MODE_DOCTOR_CONVERSATION;
  return VOICE_MODE_QUESTION;
}

function isDiagnosisMode() {
  return state.voiceMode === VOICE_MODE_DIAGNOSIS;
}

function isDoctorConversationMode() {
  return state.voiceMode === VOICE_MODE_DOCTOR_CONVERSATION;
}

function isVoiceRealtimeSupported() {
  if (REALTIME_TRANSPORT_MODE === "websocket") {
    return Boolean(window.WebSocket && window.fetch);
  }
  return Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
}

function isRealtimeModeAllowed() {
  return !isDiagnosisMode();
}

function getRealtimePromptKey() {
  return isDoctorConversationMode() ? "voiceDoctorTurn" : "voiceTurn";
}

function getRealtimeModeLabel() {
  return isDoctorConversationMode() ? "Arzt-Arzt" : "Arzt-Patient";
}

function selectOpenAiRealtimeModel() {
  return state.voiceModel === "@cf/openai/gpt-oss-120b"
    ? OPENAI_REALTIME_MODEL_STRONG
    : OPENAI_REALTIME_MODEL_FAST;
}

function applyVoiceMode(mode, options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  state.voiceMode = normalizeVoiceMode(mode);
  saveToStorage(STORAGE_VOICE_MODE_KEY, { mode: state.voiceMode });
  updateVoiceModeUi();
  if (!preserveStatus) {
    setVoiceStatus(buildVoiceReadyStatus());
  }
}

function buildVoiceReadyStatus() {
  if (state.voiceRealtimeConnecting) {
    return `Realtime wird verbunden (${getRealtimeModeLabel()}) ...`;
  }
  if (state.voiceRealtimeActive) {
    return `Realtime aktiv (${getRealtimeModeLabel()}). Nutze den Aufnahme-Button fuers direkte Audio-Gespraech oder sende Text.`;
  }
  if (isDiagnosisMode()) {
    return `${getVoiceCaseStatusLabel()} aktiv | Modell: ${getVoiceModelLabel(state.voiceModel)}. Diagnosemodus: Stelle final die Diagnose und schicke sie per Text oder Sprache ab.`;
  }
  if (isDoctorConversationMode()) {
    return `${getVoiceCaseStatusLabel()} aktiv | Modell: ${getVoiceModelLabel(state.voiceModel)}. Arzt-Arzt-Modus: Stelle den Fall strukturiert vor und beantworte pruefungsnahe Rueckfragen.`;
  }
  return `${getVoiceCaseStatusLabel()} aktiv | Modell: ${getVoiceModelLabel(state.voiceModel)}. Du kannst aufnehmen oder Text senden.`;
}

function updateVoiceModeUi() {
  const diagnosisMode = isDiagnosisMode();
  const doctorConversationMode = isDoctorConversationMode();
  const patientConversationMode = !diagnosisMode && !doctorConversationMode;
  if (refs.voiceTextInput) {
    refs.voiceTextInput.placeholder = diagnosisMode
      ? "Formuliere hier deine Verdachtsdiagnose (z. B. 'Akute Appendizitis')."
      : doctorConversationMode
        ? "Stelle den Fall strukturiert vor oder beantworte die Rueckfrage der pruefenden Aerztin/des pruefenden Arztes."
        : "Schreibe hier deine Frage an den Patienten und klicke auf 'Text senden'.";
  }
  if (refs.voiceTextSendBtn) {
    refs.voiceTextSendBtn.textContent = diagnosisMode
      ? "Diagnose abschicken"
      : doctorConversationMode
        ? "Bericht senden"
        : "Text senden";
  }
  if (refs.voiceDiagnoseBtn) {
    refs.voiceDiagnoseBtn.classList.toggle("active", diagnosisMode);
    refs.voiceDiagnoseBtn.setAttribute("aria-pressed", diagnosisMode ? "true" : "false");
  }
  if (refs.voiceDoctorConversationBtn) {
    refs.voiceDoctorConversationBtn.classList.toggle("active", doctorConversationMode);
    refs.voiceDoctorConversationBtn.setAttribute("aria-pressed", doctorConversationMode ? "true" : "false");
  }
  if (refs.voiceDoctorConversationEvalBtn) {
    refs.voiceDoctorConversationEvalBtn.classList.toggle("hidden", !doctorConversationMode);
  }
  if (refs.voicePatientConversationBtn) {
    refs.voicePatientConversationBtn.classList.toggle("active", patientConversationMode);
    refs.voicePatientConversationBtn.setAttribute("aria-pressed", patientConversationMode ? "true" : "false");
  }
  if (!doctorConversationMode) {
    clearVoiceDoctorConversationEvaluationReport();
  }
  if (refs.voiceAssistantLabel) {
    refs.voiceAssistantLabel.textContent = doctorConversationMode ? "Prueferarzt:" : "Patient:";
  }
  if (diagnosisMode && (state.voiceRealtimeActive || state.voiceRealtimeConnecting)) {
    stopVoiceRealtimeSession({ preserveStatus: true, silent: true });
  }
  updateVoiceRealtimeUi();
  updateVoiceRecordButton();
}

async function handleVoiceRecordToggle() {
  if (state.voiceBusy) return;
  if (state.voiceRealtimeConnecting) {
    setVoiceStatus("Realtime verbindet gerade. Bitte kurz warten.", true);
    return;
  }
  if (state.voiceRecording) {
    stopVoiceRecording(true, "manual-stop");
    return;
  }
  await startVoiceRecording();
}

async function handleVoiceRealtimeToggle() {
  if (state.voiceBusy) return;
  if (state.voiceRecording) {
    setVoiceStatus("Bitte zuerst die laufende Aufnahme stoppen.", true);
    return;
  }
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    stopVoiceRealtimeSession({ preserveStatus: false, reason: "manual" });
    return;
  }
  if (!isRealtimeModeAllowed()) {
    setVoiceStatus("Realtime ist nur im Arzt-Patient- oder Arzt-Arzt-Gespraech verfuegbar.", true);
    return;
  }
  if (!isVoiceRealtimeSupported()) {
    setVoiceStatus(
      REALTIME_TRANSPORT_MODE === "websocket"
        ? "Realtime wird auf diesem Geraet/Browser nicht unterstuetzt (WebSocket erforderlich)."
        : "Realtime wird auf diesem Geraet/Browser nicht unterstuetzt (WebRTC + Mikrofon erforderlich).",
      true
    );
    return;
  }
  await startVoiceRealtimeSession();
}

function handleVoiceRealtimeMuteToggle() {
  if (!state.voiceRealtimeActive || !realtimeLocalStream) return;
  const nextMuted = !state.voiceRealtimeMuted;
  for (const track of realtimeLocalStream.getAudioTracks()) {
    track.enabled = !nextMuted;
  }
  state.voiceRealtimeMuted = nextMuted;
  updateVoiceRealtimeUi();
  setVoiceStatus(nextMuted ? "Realtime-Mikrofon stummgeschaltet." : "Realtime-Mikrofon wieder aktiv.");
}

function updateVoiceRealtimeUi() {
  const toggleBtn = refs.voiceRealtimeToggleBtn;
  const muteBtn = refs.voiceRealtimeMuteBtn;
  const stateLabel = refs.voiceRealtimeState;
  if (!toggleBtn || !muteBtn || !stateLabel) return;

  const supported = isVoiceRealtimeSupported();
  const allowedMode = isRealtimeModeAllowed();
  const connecting = Boolean(state.voiceRealtimeConnecting);
  const active = Boolean(state.voiceRealtimeActive);
  const muted = Boolean(state.voiceRealtimeMuted);

  if (connecting) {
    toggleBtn.textContent = "Realtime verbindet ...";
  } else if (active) {
    toggleBtn.textContent = "Realtime beenden";
  } else {
    toggleBtn.textContent = "Realtime starten";
  }
  toggleBtn.classList.toggle("active", active || connecting);
  toggleBtn.setAttribute("aria-pressed", active ? "true" : "false");

  muteBtn.classList.toggle("hidden", !active || !realtimeLocalStream);
  muteBtn.textContent = muted ? "Mikro einschalten" : "Mikro stummschalten";
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");

  if (!supported) {
    stateLabel.textContent =
      REALTIME_TRANSPORT_MODE === "websocket"
        ? "Realtime nicht verfuegbar (Browser ohne WebSocket-Unterstuetzung)."
        : "Realtime nicht verfuegbar (Browser/Geraet ohne WebRTC-Audio).";
  } else if (!allowedMode) {
    stateLabel.textContent = "Realtime: nur im Arzt-Patient- oder Arzt-Arzt-Modus.";
  } else if (connecting) {
    stateLabel.textContent = `Realtime verbindet (${getRealtimeModeLabel()}) ...`;
  } else if (active) {
    stateLabel.textContent = `Realtime aktiv (${getRealtimeModeLabel()}).`;
  } else {
    stateLabel.textContent = "Realtime aus.";
  }

  if (!supported) {
    toggleBtn.disabled = true;
  } else if (!allowedMode && !active && !connecting) {
    toggleBtn.disabled = true;
  } else {
    toggleBtn.disabled = state.voiceBusy || state.voiceRecording;
  }
  muteBtn.disabled = state.voiceBusy || !active;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REALTIME_CONNECT_TIMEOUT_MS) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = window.setTimeout(() => {
    if (!controller) return;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Realtime-Timeout nach ${Math.round(timeoutMs / 1000)}s.`);
      timeoutError.code = "REALTIME_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function parseJsonSafe(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function pushUniqueSdpCandidate(list, label, value) {
  if (!Array.isArray(list)) return;
  const text = String(value || "").trim();
  if (!text) return;
  if (list.some((entry) => String(entry?.value || "") === text)) return;
  list.push({ label: String(label || "sdp"), value: text });
}

function extractSdpFromJsonCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return "";
  const directKeys = ["sdp", "answer_sdp", "answerSdp"];
  for (const key of directKeys) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  if (candidate.answer && typeof candidate.answer === "object") {
    const nested = extractSdpFromJsonCandidate(candidate.answer);
    if (nested) return nested;
  }
  if (candidate.data && typeof candidate.data === "object") {
    const nested = extractSdpFromJsonCandidate(candidate.data);
    if (nested) return nested;
  }
  if (candidate.response && typeof candidate.response === "object") {
    const nested = extractSdpFromJsonCandidate(candidate.response);
    if (nested) return nested;
  }
  return "";
}

function sanitizeSdpAscii(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .trim();
}

function normalizeSdpLineBreaks(value, mode = "crlf", ensureFinalBreak = false) {
  const normalized = sanitizeSdpAscii(value)
    .replace(/\r\n|\n|\r/g, "\n")
    .split("\n")
    .map((line) => String(line || "").trimEnd())
    .join("\n")
    .trim();
  if (!normalized) return "";
  const body = mode === "lf" ? normalized : normalized.replace(/\n/g, "\r\n");
  if (!ensureFinalBreak) return body;
  return mode === "lf" ? `${body}\n` : `${body}\r\n`;
}

function sanitizeCandidateLine(line) {
  const text = String(line || "").trim();
  const prefix = "a=candidate:";
  if (!text.startsWith(prefix)) return text;

  const body = text.slice(prefix.length).trim();
  const tokens = body.split(/\s+/).filter(Boolean);
  if (tokens.length < 8) return text;
  if (tokens[6] !== "typ") return text;

  const base = tokens.slice(0, 8);
  const extras = [];
  for (let index = 8; index + 1 < tokens.length; index += 2) {
    const key = String(tokens[index] || "").trim();
    const value = String(tokens[index + 1] || "").trim();
    if (!key || !value) continue;
    if (key === "raddr" || key === "rport" || key === "tcptype") {
      extras.push(key, value);
    }
  }

  return `${prefix}${[...base, ...extras].join(" ")}`;
}

function sanitizeSdpCandidateLines(value) {
  const lines = splitSdpLines(value);
  if (!lines.length) return "";
  return joinSdpLines(
    lines.map((line) => {
      if (String(line || "").trim().startsWith("a=candidate:")) {
        return sanitizeCandidateLine(line);
      }
      return String(line || "").trim();
    })
  );
}

function keepOnlyUdpCandidates(value) {
  const lines = splitSdpLines(value);
  if (!lines.length) return "";
  const filtered = [];
  let removedTcpCount = 0;

  for (const line of lines) {
    const text = String(line || "").trim();
    if (!text.startsWith("a=candidate:")) {
      filtered.push(text);
      continue;
    }

    const body = text.slice("a=candidate:".length).trim();
    const tokens = body.split(/\s+/).filter(Boolean);
    const transport = String(tokens[2] || "").toLowerCase();
    if (transport && transport !== "udp") {
      removedTcpCount += 1;
      continue;
    }
    filtered.push(text);
  }

  if (!filtered.length) return "";
  // Keep at least one candidate set; if everything got removed, return original.
  const hasAnyCandidate = filtered.some((line) => String(line || "").startsWith("a=candidate:"));
  if (!hasAnyCandidate && removedTcpCount > 0) {
    return joinSdpLines(lines);
  }
  return joinSdpLines(filtered);
}

function collectInlineIceCandidates(value) {
  const lines = splitSdpLines(value);
  const result = [];
  let currentMid = "";
  let currentMLineIndex = -1;

  for (const line of lines) {
    const text = String(line || "").trim();
    if (!text) continue;
    if (text.startsWith("m=")) {
      currentMLineIndex += 1;
      currentMid = "";
      continue;
    }
    if (text.startsWith("a=mid:")) {
      currentMid = text.slice("a=mid:".length).trim();
      continue;
    }
    if (!text.startsWith("a=candidate:")) continue;
    const sanitizedLine = sanitizeCandidateLine(text);
    const body = sanitizedLine.slice("a=candidate:".length).trim();
    const tokens = body.split(/\s+/).filter(Boolean);
    const transport = String(tokens[2] || "").toLowerCase();
    if (transport && transport !== "udp") continue;

    result.push({
      candidate: sanitizedLine.slice("a=".length),
      sdpMid: currentMid || undefined,
      sdpMLineIndex: currentMLineIndex >= 0 ? currentMLineIndex : undefined
    });
  }

  return result;
}

function stripInlineIceCandidates(value) {
  const lines = splitSdpLines(value);
  if (!lines.length) return "";
  return joinSdpLines(
    lines.filter((line) => {
      const text = String(line || "").trim();
      if (text.startsWith("a=candidate:")) return false;
      if (text === "a=end-of-candidates") return false;
      return true;
    })
  );
}

function stripSctpOptionalLines(value) {
  const lines = splitSdpLines(value);
  if (!lines.length) return "";
  return joinSdpLines(
    lines.filter((line) => {
      const text = String(line || "").trim();
      if (text.startsWith("a=max-message-size:")) return false;
      return true;
    })
  );
}

function stripApplicationMediaSection(value) {
  const lines = filterValidSdpLines(segmentSdpLines(splitSdpLines(value)));
  if (!lines.length) return "";

  const firstMediaIndex = lines.findIndex((line) => line.startsWith("m="));
  if (firstMediaIndex < 0) return joinSdpLines(lines);

  const sessionLines = lines.slice(0, firstMediaIndex);
  const mediaLines = lines.slice(firstMediaIndex);
  const sectionStarts = [];
  for (let index = 0; index < mediaLines.length; index += 1) {
    if (mediaLines[index].startsWith("m=")) sectionStarts.push(index);
  }
  if (!sectionStarts.length) return joinSdpLines(lines);

  const keptSections = [];
  for (let s = 0; s < sectionStarts.length; s += 1) {
    const start = sectionStarts[s];
    const end = sectionStarts[s + 1] ?? mediaLines.length;
    const section = mediaLines.slice(start, end);
    if (!section.length) continue;
    const mLine = section[0];
    if (mLine.startsWith("m=application ")) continue;
    keptSections.push(section);
  }
  if (!keptSections.length) return joinSdpLines(lines);

  const mids = keptSections
    .map((section) => section.find((line) => line.startsWith("a=mid:")) || "")
    .map((line) => line.replace(/^a=mid:/, "").trim())
    .filter(Boolean);

  const updatedSession = sessionLines
    .map((line) => {
      if (!line.startsWith("a=group:BUNDLE")) return line;
      if (!mids.length) return "";
      return `a=group:BUNDLE ${mids.join(" ")}`;
    })
    .filter(Boolean);

  return joinSdpLines([...updatedSession, ...keptSections.flat()]);
}

function promoteMediaIceToSession(value) {
  const lines = filterValidSdpLines(segmentSdpLines(splitSdpLines(value)));
  if (!lines.length) return "";

  const firstMediaIndex = lines.findIndex((line) => line.startsWith("m="));
  if (firstMediaIndex < 0) return joinSdpLines(lines);

  const sessionLines = lines.slice(0, firstMediaIndex);
  const mediaLines = lines.slice(firstMediaIndex);

  const sectionStarts = [];
  for (let index = 0; index < mediaLines.length; index += 1) {
    if (mediaLines[index].startsWith("m=")) sectionStarts.push(index);
  }
  if (!sectionStarts.length) return joinSdpLines(lines);

  let sharedUfrag = "";
  let sharedPwd = "";
  const rewrittenSections = [];

  for (let s = 0; s < sectionStarts.length; s += 1) {
    const start = sectionStarts[s];
    const end = sectionStarts[s + 1] ?? mediaLines.length;
    const section = mediaLines.slice(start, end);
    if (!section.length) continue;

    for (const line of section) {
      if (!sharedUfrag && line.startsWith("a=ice-ufrag:")) {
        sharedUfrag = line;
      }
      if (!sharedPwd && line.startsWith("a=ice-pwd:")) {
        sharedPwd = line;
      }
    }

    const cleanedSection = section.filter(
      (line) => !line.startsWith("a=ice-ufrag:") && !line.startsWith("a=ice-pwd:")
    );
    rewrittenSections.push(cleanedSection);
  }

  if (!sharedUfrag || !sharedPwd) {
    return joinSdpLines(lines);
  }

  const cleanedSession = sessionLines.filter(
    (line) => !line.startsWith("a=ice-ufrag:") && !line.startsWith("a=ice-pwd:")
  );
  const insertIndex = cleanedSession.findIndex((line) => line.startsWith("a=fingerprint:"));
  if (insertIndex >= 0) {
    cleanedSession.splice(insertIndex, 0, sharedUfrag, sharedPwd);
  } else {
    cleanedSession.push(sharedUfrag, sharedPwd);
  }

  return joinSdpLines([...cleanedSession, ...rewrittenSections.flat()]);
}

function splitSdpIntoSections(value) {
  const lines = filterValidSdpLines(segmentSdpLines(splitSdpLines(value)));
  if (!lines.length) {
    return { sessionLines: [], mediaSections: [] };
  }

  const firstMediaIndex = lines.findIndex((line) => line.startsWith("m="));
  if (firstMediaIndex < 0) {
    return { sessionLines: lines, mediaSections: [] };
  }

  const sessionLines = lines.slice(0, firstMediaIndex);
  const mediaLines = lines.slice(firstMediaIndex);
  const mediaSections = [];
  let current = [];
  for (const line of mediaLines) {
    if (line.startsWith("m=") && current.length) {
      mediaSections.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length) {
    mediaSections.push(current);
  }

  return { sessionLines, mediaSections };
}

function findFirstLineByPrefix(lines, prefix) {
  return (Array.isArray(lines) ? lines : []).find((line) => String(line || "").startsWith(prefix)) || "";
}

function findLinesByRegex(lines, regex) {
  return (Array.isArray(lines) ? lines : []).filter((line) => regex.test(String(line || "")));
}

function buildMinimalAudioAnswerSdp(value) {
  const normalized = normalizeSdpForWebRtc(value);
  if (!normalized) return "";

  const { sessionLines, mediaSections } = splitSdpIntoSections(normalized);
  const audioSection = mediaSections.find((section) => String(section?.[0] || "").startsWith("m=audio "));
  if (!audioSection) return "";

  const audioMLine = String(audioSection[0] || "").trim();
  const audioCLine =
    findFirstLineByPrefix(audioSection, "c=") || findFirstLineByPrefix(sessionLines, "c=") || "c=IN IP4 0.0.0.0";
  const setupLine =
    findFirstLineByPrefix(audioSection, "a=setup:") ||
    findFirstLineByPrefix(sessionLines, "a=setup:") ||
    "a=setup:active";
  const midLine = "a=mid:0";
  const iceUfrag =
    findFirstLineByPrefix(audioSection, "a=ice-ufrag:") ||
    findFirstLineByPrefix(sessionLines, "a=ice-ufrag:");
  const icePwd =
    findFirstLineByPrefix(audioSection, "a=ice-pwd:") || findFirstLineByPrefix(sessionLines, "a=ice-pwd:");
  const rtcpMux = findFirstLineByPrefix(audioSection, "a=rtcp-mux") || "a=rtcp-mux";
  const fingerprint =
    findFirstLineByPrefix(sessionLines, "a=fingerprint:") ||
    findFirstLineByPrefix(audioSection, "a=fingerprint:");

  if (!iceUfrag || !icePwd || !fingerprint) return "";

  const baseSession = [
    findFirstLineByPrefix(sessionLines, "v=") || "v=0",
    findFirstLineByPrefix(sessionLines, "o=") || "o=- 0 0 IN IP4 0.0.0.0",
    findFirstLineByPrefix(sessionLines, "s=") || "s=-",
    findFirstLineByPrefix(sessionLines, "t=") || "t=0 0",
    fingerprint
  ];

  const audioAttrs = [
    ...findLinesByRegex(audioSection, /^a=rtpmap:/),
    ...findLinesByRegex(audioSection, /^a=fmtp:/),
    ...findLinesByRegex(audioSection, /^a=rtcp-fb:/),
    ...findLinesByRegex(audioSection, /^a=ptime:/),
    ...findLinesByRegex(audioSection, /^a=maxptime:/),
    ...findLinesByRegex(audioSection, /^a=extmap:/),
    ...findLinesByRegex(audioSection, /^a=ssrc:/),
    ...findLinesByRegex(audioSection, /^a=ssrc-group:/)
  ];

  const minimalLines = [
    ...baseSession,
    audioMLine,
    audioCLine,
    midLine,
    setupLine,
    iceUfrag,
    icePwd,
    rtcpMux,
    ...audioAttrs
  ];

  return joinSdpLines(minimalLines);
}

function buildMinimalAudioStaticSdp(value) {
  const normalized = normalizeSdpForWebRtc(value);
  if (!normalized) return "";

  const { sessionLines, mediaSections } = splitSdpIntoSections(normalized);
  const audioSection = mediaSections.find((section) => String(section?.[0] || "").startsWith("m=audio "));
  if (!audioSection) return "";

  const audioCLine =
    findFirstLineByPrefix(audioSection, "c=") || findFirstLineByPrefix(sessionLines, "c=") || "c=IN IP4 0.0.0.0";
  const setupLine =
    findFirstLineByPrefix(audioSection, "a=setup:") ||
    findFirstLineByPrefix(sessionLines, "a=setup:") ||
    "a=setup:active";
  const iceUfrag =
    findFirstLineByPrefix(audioSection, "a=ice-ufrag:") ||
    findFirstLineByPrefix(sessionLines, "a=ice-ufrag:");
  const icePwd =
    findFirstLineByPrefix(audioSection, "a=ice-pwd:") || findFirstLineByPrefix(sessionLines, "a=ice-pwd:");
  const rtcpMux = findFirstLineByPrefix(audioSection, "a=rtcp-mux") || "a=rtcp-mux";
  const fingerprint =
    findFirstLineByPrefix(sessionLines, "a=fingerprint:") ||
    findFirstLineByPrefix(audioSection, "a=fingerprint:");

  if (!iceUfrag || !icePwd || !fingerprint) return "";

  const staticMLine = "m=audio 9 UDP/TLS/RTP/SAVPF 0 8";
  const lines = [
    findFirstLineByPrefix(sessionLines, "v=") || "v=0",
    findFirstLineByPrefix(sessionLines, "o=") || "o=- 0 0 IN IP4 0.0.0.0",
    findFirstLineByPrefix(sessionLines, "s=") || "s=-",
    findFirstLineByPrefix(sessionLines, "t=") || "t=0 0",
    fingerprint,
    staticMLine,
    audioCLine,
    "a=mid:0",
    setupLine,
    iceUfrag,
    icePwd,
    rtcpMux
  ];
  return joinSdpLines(lines);
}

function buildMinimalAudioCoreSdp(value) {
  const base = buildMinimalAudioStaticSdp(value);
  if (!base) return "";
  const coreLines = splitSdpLines(base).filter((line) => {
    const text = String(line || "").trim();
    if (text.startsWith("a=rtcp-mux")) return false;
    if (text.startsWith("a=setup:")) return false;
    if (text.startsWith("a=mid:")) return false;
    return true;
  });
  return joinSdpLines(coreLines);
}

function getAudioSectionTrickleCandidates(value) {
  const allCandidates = collectInlineIceCandidates(value);
  if (!allCandidates.length) return [];
  const audioCandidates = allCandidates.filter((candidate) => {
    if (typeof candidate?.sdpMLineIndex === "number") {
      return candidate.sdpMLineIndex === 0;
    }
    return candidate?.sdpMid === "0";
  });
  const source = audioCandidates.length ? audioCandidates : allCandidates;
  return source.map((candidate) => ({
    candidate: String(candidate?.candidate || ""),
    sdpMid: "0",
    sdpMLineIndex: 0
  }));
}

function extractSdpFromResponseText(rawText) {
  let text = String(rawText || "").trim();
  if (!text) return "";

  const parsed = parseJsonSafe(text);
  if (parsed) {
    if (typeof parsed === "string") {
      text = parsed.trim();
    } else if (typeof parsed === "object") {
      const extracted = extractSdpFromJsonCandidate(parsed);
      if (extracted) {
        text = extracted;
      }
    }
  }

  if (text.includes("\\r\\n") || text.includes("\\n")) {
    text = text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }

  const sdpStart = text.indexOf("v=0");
  if (sdpStart >= 0) {
    text = text.slice(sdpStart);
  }

  // Remove multipart boundary or trailing JSON payload if present.
  const boundaryIndex = text.search(/\r?\n--[^\r\n]+/);
  if (boundaryIndex > 0) {
    text = text.slice(0, boundaryIndex);
  }
  const trailingJsonIndex = text.search(/\r?\n\{"/);
  if (trailingJsonIndex > 0) {
    text = text.slice(0, trailingJsonIndex);
  }

  return text.trim();
}

function splitSdpLines(value) {
  return String(value || "")
    .split(/\r\n|\n|\r/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);
}

function joinSdpLines(lines) {
  if (!Array.isArray(lines) || !lines.length) return "";
  return lines.join("\r\n").trim();
}

function segmentSdpLines(lines) {
  const segmented = [];
  for (const line of lines) {
    const text = String(line || "").trim();
    if (!text) continue;
    const chunks = text.split(/\s+(?=[a-z]=)/g).map((chunk) => String(chunk || "").trim());
    for (const chunk of chunks) {
      if (chunk) {
        segmented.push(chunk);
      }
    }
  }
  return segmented;
}

function filterValidSdpLines(lines) {
  return (Array.isArray(lines) ? lines : []).filter((line) => /^[a-z]=\S/.test(String(line || "")));
}

function moveSessionIceToMediaSections(value) {
  const baseLines = filterValidSdpLines(segmentSdpLines(splitSdpLines(value)));
  if (!baseLines.length) return "";

  const firstMediaIndex = baseLines.findIndex((line) => line.startsWith("m="));
  if (firstMediaIndex < 0) return joinSdpLines(baseLines);

  const sessionLines = baseLines.slice(0, firstMediaIndex);
  const mediaLines = baseLines.slice(firstMediaIndex);

  const sessionIcePwd = sessionLines.find((line) => line.startsWith("a=ice-pwd:")) || "";
  const sessionIceUfrag = sessionLines.find((line) => line.startsWith("a=ice-ufrag:")) || "";
  if (!sessionIcePwd && !sessionIceUfrag) {
    return joinSdpLines(baseLines);
  }

  const cleanedSession = sessionLines.filter(
    (line) => !line.startsWith("a=ice-pwd:") && !line.startsWith("a=ice-ufrag:")
  );
  const sectionStarts = [];
  for (let index = 0; index < mediaLines.length; index += 1) {
    if (mediaLines[index].startsWith("m=")) {
      sectionStarts.push(index);
    }
  }
  if (!sectionStarts.length) {
    return joinSdpLines(baseLines);
  }

  const rebuiltMedia = [];
  for (let s = 0; s < sectionStarts.length; s += 1) {
    const start = sectionStarts[s];
    const end = sectionStarts[s + 1] ?? mediaLines.length;
    const section = mediaLines.slice(start, end);
    if (!section.length) continue;

    const hasPwd = section.some((line) => line.startsWith("a=ice-pwd:"));
    const hasUfrag = section.some((line) => line.startsWith("a=ice-ufrag:"));
    const head = section[0];
    const tail = section.slice(1);

    rebuiltMedia.push(head);
    if (!hasUfrag && sessionIceUfrag) rebuiltMedia.push(sessionIceUfrag);
    if (!hasPwd && sessionIcePwd) rebuiltMedia.push(sessionIcePwd);
    rebuiltMedia.push(...tail);
  }

  return joinSdpLines([...cleanedSession, ...rebuiltMedia]);
}

function stripOptionalSdpLines(value) {
  const lines = filterValidSdpLines(segmentSdpLines(splitSdpLines(value)));
  if (!lines.length) return "";
  const filtered = lines.filter((line) => {
    if (line === "a=extmap-allow-mixed") return false;
    if (line.startsWith("a=msid-semantic:")) return false;
    return true;
  });
  return joinSdpLines(filtered);
}

function rebuildFlattenedSdp(value) {
  let text = String(value || "");
  if (!text) return "";
  if (/\r|\n/.test(text)) return text;
  if (!text.startsWith("v=0")) return text;

  // Some gateways collapse SDP into one line. Re-insert line breaks at likely field starts.
  const aFieldCount = (text.match(/\sa=/g) || []).length;
  if (aFieldCount < 4) return text;

  text = text.replace(/\s+(?=(?:v=0|o=|s=|t=|i=|u=|e=|p=|c=|b=|r=|z=|k=|a=))/g, "\r\n");
  text = text.replace(/\s+(?=m=(?:audio|video|application|text|message)\b)/g, "\r\n");
  return text;
}

function normalizeSdpForWebRtc(rawValue) {
  let text = extractSdpFromResponseText(rawValue);
  if (!text) return "";

  if (
    (text.startsWith("\"") && text.endsWith("\"")) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    const parsedQuoted = parseJsonSafe(text);
    if (typeof parsedQuoted === "string" && parsedQuoted.trim()) {
      text = parsedQuoted.trim();
    } else {
      text = text.slice(1, -1).trim();
    }
  }

  if (text.includes("\\r\\n") || text.includes("\\n")) {
    text = text.replace(/\\r\\n/g, "\r\n").replace(/\\n/g, "\n");
  }

  const startIndex = text.indexOf("v=0");
  if (startIndex > 0) {
    text = text.slice(startIndex);
  }

  text = rebuildFlattenedSdp(text);
  text = sanitizeSdpAscii(text).replace(/\r\n|\n|\r/g, "\r\n").trim();
  text = sanitizeSdpCandidateLines(text);
  const strictLines = filterValidSdpLines(segmentSdpLines(splitSdpLines(text)));
  if (strictLines.length) {
    text = joinSdpLines(strictLines);
  }
  const withMediaIce = moveSessionIceToMediaSections(text);
  if (withMediaIce) {
    text = withMediaIce;
  }
  return text;
}

function looksLikeSdpAnswer(value) {
  const text = String(value || "");
  return text.startsWith("v=0") && text.includes("\nm=") && text.includes("a=ice-");
}

function buildSdpCandidateList(rawValue) {
  const rawText = String(rawValue || "");
  const extractedText = extractSdpFromResponseText(rawText);
  const list = [];

  pushUniqueSdpCandidate(list, "raw", extractedText || rawText);

  const parsedFromRaw = parseJsonSafe(extractedText || rawText);
  if (parsedFromRaw && typeof parsedFromRaw === "object") {
    const extracted = extractSdpFromJsonCandidate(parsedFromRaw);
    pushUniqueSdpCandidate(list, "json-extracted", extracted);
  }

  if (rawText.includes("\\r\\n") || rawText.includes("\\n")) {
    const unescaped = rawText.replace(/\\r\\n/g, "\r\n").replace(/\\n/g, "\n");
    pushUniqueSdpCandidate(list, "unescaped", unescaped);
  }

  const normalized = normalizeSdpForWebRtc(extractedText || rawText);
  pushUniqueSdpCandidate(list, "normalized", normalized);

  const lineBased = (extractedText || rawText)
    .replace(/\u0000/g, "")
    .split(/\r\n|\n|\r/)
    .map((line) => String(line || "").trimEnd())
    .filter((line) => line.length > 0)
    .join("\r\n");
  pushUniqueSdpCandidate(list, "line-based", lineBased);

  const asciiSanitized = sanitizeSdpAscii(extractedText || rawText).replace(/\r\n|\n|\r/g, "\r\n");
  pushUniqueSdpCandidate(list, "ascii-sanitized", asciiSanitized);

  const rebuiltFlat = normalizeSdpForWebRtc(rebuildFlattenedSdp(extractedText || rawText));
  pushUniqueSdpCandidate(list, "rebuilt-flat", rebuiltFlat);

  const segmentedStrict = joinSdpLines(
    filterValidSdpLines(segmentSdpLines(splitSdpLines(sanitizeSdpAscii(extractedText || rawText))))
  );
  pushUniqueSdpCandidate(list, "segmented-strict", segmentedStrict);

  const mediaIceNormalized = moveSessionIceToMediaSections(
    normalizeSdpForWebRtc(extractedText || rawText)
  );
  pushUniqueSdpCandidate(list, "media-ice-normalized", mediaIceNormalized);

  const optionalStripped = stripOptionalSdpLines(normalizeSdpForWebRtc(extractedText || rawText));
  pushUniqueSdpCandidate(list, "optional-stripped", optionalStripped);

  const candidateSanitized = normalizeSdpForWebRtc(
    sanitizeSdpCandidateLines(extractedText || rawText)
  );
  pushUniqueSdpCandidate(list, "candidate-sanitized", candidateSanitized);

  const udpOnlyCandidates = normalizeSdpForWebRtc(keepOnlyUdpCandidates(candidateSanitized || normalized));
  pushUniqueSdpCandidate(list, "udp-candidates-only", udpOnlyCandidates);

  const lfVariant = normalizeSdpLineBreaks(extractedText || rawText, "lf", false);
  pushUniqueSdpCandidate(list, "lf-only", lfVariant);

  const lfFinal = normalizeSdpLineBreaks(extractedText || rawText, "lf", true);
  pushUniqueSdpCandidate(list, "lf-final-break", lfFinal);

  const crlfFinal = normalizeSdpLineBreaks(extractedText || rawText, "crlf", true);
  pushUniqueSdpCandidate(list, "crlf-final-break", crlfFinal);

  const audioOnly = stripApplicationMediaSection(udpOnlyCandidates || candidateSanitized || normalized);
  pushUniqueSdpCandidate(list, "audio-only", audioOnly);

  const strippedInlineCandidates = stripInlineIceCandidates(
    udpOnlyCandidates || candidateSanitized || normalized
  );
  const trickleCandidates = collectInlineIceCandidates(udpOnlyCandidates || candidateSanitized || normalized);
  if (strippedInlineCandidates && trickleCandidates.length) {
    const already = list.find(
      (entry) => String(entry?.value || "").trim() === String(strippedInlineCandidates).trim()
    );
    if (!already) {
      list.push({
        label: "stripped-inline-candidates",
        value: strippedInlineCandidates,
        trickleCandidates
      });
    }
  }

  const sctpOptionalStripped = normalizeSdpForWebRtc(
    stripSctpOptionalLines(strippedInlineCandidates || udpOnlyCandidates || candidateSanitized || normalized)
  );
  pushUniqueSdpCandidate(list, "sctp-optional-stripped", sctpOptionalStripped);
  if (sctpOptionalStripped && trickleCandidates.length) {
    const alreadySctp = list.find(
      (entry) => String(entry?.value || "").trim() === String(sctpOptionalStripped).trim()
    );
    if (alreadySctp) {
      alreadySctp.trickleCandidates = trickleCandidates;
    } else {
      list.push({
        label: "sctp-optional-stripped-trickle",
        value: sctpOptionalStripped,
        trickleCandidates
      });
    }
  }

  const sessionIcePromoted = promoteMediaIceToSession(
    strippedInlineCandidates || udpOnlyCandidates || candidateSanitized || normalized
  );
  pushUniqueSdpCandidate(list, "session-ice", sessionIcePromoted);

  const audioOnlyInlineCandidates = collectInlineIceCandidates(
    audioOnly || udpOnlyCandidates || candidateSanitized || normalized
  );
  const audioOnlyNoInline = normalizeSdpForWebRtc(
    stripInlineIceCandidates(audioOnly || strippedInlineCandidates || udpOnlyCandidates || candidateSanitized || normalized)
  );
  pushUniqueSdpCandidate(list, "audio-only-no-inline", audioOnlyNoInline);

  const audioOnlyNoInlineSctp = normalizeSdpForWebRtc(
    stripSctpOptionalLines(audioOnlyNoInline || audioOnly || sctpOptionalStripped || normalized)
  );
  pushUniqueSdpCandidate(list, "audio-only-no-inline-sctp", audioOnlyNoInlineSctp);

  if (audioOnlyNoInlineSctp && audioOnlyInlineCandidates.length) {
    const existingAudioNoInlineSctp = list.find(
      (entry) => String(entry?.value || "").trim() === String(audioOnlyNoInlineSctp).trim()
    );
    if (existingAudioNoInlineSctp) {
      existingAudioNoInlineSctp.trickleCandidates = audioOnlyInlineCandidates;
    } else {
      list.push({
        label: "audio-only-no-inline-sctp-trickle",
        value: audioOnlyNoInlineSctp,
        trickleCandidates: audioOnlyInlineCandidates
      });
    }
  }

  const audioOnlySessionIce = promoteMediaIceToSession(audioOnlyNoInlineSctp || audioOnlyNoInline || audioOnly);
  pushUniqueSdpCandidate(list, "audio-only-session-ice", audioOnlySessionIce);

  const minimalAudioSdp = buildMinimalAudioAnswerSdp(
    audioOnlyNoInlineSctp || audioOnlyNoInline || audioOnly || normalized
  );
  const minimalAudioCandidates = getAudioSectionTrickleCandidates(
    strippedInlineCandidates || udpOnlyCandidates || candidateSanitized || normalized
  );
  pushUniqueSdpCandidate(list, "minimal-audio", minimalAudioSdp);
  if (minimalAudioSdp && minimalAudioCandidates.length) {
    const existingMinimal = list.find(
      (entry) => String(entry?.value || "").trim() === String(minimalAudioSdp).trim()
    );
    if (existingMinimal) {
      existingMinimal.trickleCandidates = minimalAudioCandidates;
    } else {
      list.push({
        label: "minimal-audio-trickle",
        value: minimalAudioSdp,
        trickleCandidates: minimalAudioCandidates
      });
    }
  }

  const minimalAudioStaticSdp = buildMinimalAudioStaticSdp(
    audioOnlyNoInlineSctp || audioOnlyNoInline || audioOnly || normalized
  );
  pushUniqueSdpCandidate(list, "minimal-audio-static", minimalAudioStaticSdp);
  if (minimalAudioStaticSdp && minimalAudioCandidates.length) {
    const existingStaticMinimal = list.find(
      (entry) => String(entry?.value || "").trim() === String(minimalAudioStaticSdp).trim()
    );
    if (existingStaticMinimal) {
      existingStaticMinimal.trickleCandidates = minimalAudioCandidates;
    } else {
      list.push({
        label: "minimal-audio-static-trickle",
        value: minimalAudioStaticSdp,
        trickleCandidates: minimalAudioCandidates
      });
    }
  }

  const minimalAudioCoreSdp = buildMinimalAudioCoreSdp(
    minimalAudioStaticSdp || audioOnlyNoInlineSctp || audioOnlyNoInline || audioOnly || normalized
  );
  pushUniqueSdpCandidate(list, "minimal-audio-core", minimalAudioCoreSdp);
  if (minimalAudioCoreSdp && minimalAudioCandidates.length) {
    const existingCoreMinimal = list.find(
      (entry) => String(entry?.value || "").trim() === String(minimalAudioCoreSdp).trim()
    );
    if (existingCoreMinimal) {
      existingCoreMinimal.trickleCandidates = minimalAudioCandidates;
    } else {
      list.push({
        label: "minimal-audio-core-trickle",
        value: minimalAudioCoreSdp,
        trickleCandidates: minimalAudioCandidates
      });
    }
  }

  return list.filter((entry) => String(entry?.value || "").includes("v=0"));
}

function extractInvalidSdpLineFromErrorMessage(message) {
  const text = String(message || "").trim();
  if (!text) return "";
  const parserLineMatch = text.match(
    /Failed to parse SessionDescription\.\s*([^\r\n]+?)\s*Invalid SDP line\.?/i
  );
  if (parserLineMatch?.[1]) {
    return String(parserLineMatch[1]).trim();
  }
  const genericLineMatch = text.match(/Invalid SDP line:\s*([^\r\n]+)$/i);
  if (genericLineMatch?.[1]) {
    return String(genericLineMatch[1]).trim();
  }
  return "";
}

function stripSdpLineByHint(value, lineHint) {
  const hint = String(lineHint || "").trim();
  if (!hint) return "";
  const sourceLines = splitSdpLines(value);
  if (!sourceLines.length) return "";
  const normalizedHint = hint.replace(/\s+/g, " ").trim();
  let removed = false;

  const kept = sourceLines.filter((line) => {
    const text = String(line || "").trim();
    if (!text) return false;
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const matches =
      normalizedText === normalizedHint ||
      normalizedText.startsWith(normalizedHint) ||
      normalizedHint.startsWith(normalizedText);
    if (matches) {
      removed = true;
      return false;
    }
    return true;
  });

  if (!removed) return "";
  return joinSdpLines(kept);
}

function queueUniqueSdpCandidate(queue, seenSet, label, value, trickleCandidates) {
  if (!Array.isArray(queue) || !(seenSet instanceof Set)) return;
  const text = String(value || "").trim();
  if (!text) return;
  if (!text.includes("v=0")) return;
  if (seenSet.has(text)) return;
  seenSet.add(text);
  queue.push({
    label: String(label || "derived"),
    value: text,
    trickleCandidates: Array.isArray(trickleCandidates) ? trickleCandidates : undefined
  });
}

async function setRemoteDescriptionWithSdpCandidates(peerConnection, rawSdp, contextLabel) {
  const candidates = buildSdpCandidateList(rawSdp);
  const candidateQueue = [];
  const seenCandidateValues = new Set();
  for (const candidate of candidates) {
    queueUniqueSdpCandidate(
      candidateQueue,
      seenCandidateValues,
      candidate.label,
      candidate.value,
      candidate.trickleCandidates
    );
  }
  let lastError = null;
  const failureSummaries = [];
  const attemptedLabels = [];
  let attempts = 0;

  while (candidateQueue.length && attempts < MAX_REALTIME_SDP_CANDIDATE_ATTEMPTS) {
    const candidate = candidateQueue.shift();
    attempts += 1;
    attemptedLabels.push(candidate.label);
    try {
      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: candidate.value
      });
      if (Array.isArray(candidate?.trickleCandidates) && candidate.trickleCandidates.length) {
        let addedCount = 0;
        for (const ice of candidate.trickleCandidates) {
          try {
            await peerConnection.addIceCandidate(ice);
            addedCount += 1;
          } catch (iceError) {
            console.warn("addIceCandidate fehlgeschlagen", iceError);
          }
        }
        try {
          await peerConnection.addIceCandidate(null);
        } catch {
          // ignore
        }
        return `${candidate.label}+trickle(${addedCount})`;
      }
      return candidate.label;
    } catch (error) {
      lastError = error;
      const short = String(error?.message || "Unbekannter Fehler")
        .replace(/\s+/g, " ")
        .slice(0, 180);
      failureSummaries.push(`${candidate.label}: ${short}`);
      console.warn(`SDP parse fehlgeschlagen (${candidate.label})`, error);

      const invalidLineHint = extractInvalidSdpLineFromErrorMessage(error?.message);
      if (invalidLineHint) {
        const strippedByHint = stripSdpLineByHint(candidate.value, invalidLineHint);
        queueUniqueSdpCandidate(
          candidateQueue,
          seenCandidateValues,
          `${candidate.label}-drop-invalid-line`,
          strippedByHint,
          candidate.trickleCandidates
        );
      }

      const strippedRtcpMux = stripSdpLineByHint(candidate.value, "a=rtcp-mux");
      queueUniqueSdpCandidate(
        candidateQueue,
        seenCandidateValues,
        `${candidate.label}-drop-rtcp-mux`,
        strippedRtcpMux,
        candidate.trickleCandidates
      );

      const strippedSendrecv = stripSdpLineByHint(candidate.value, "a=sendrecv");
      queueUniqueSdpCandidate(
        candidateQueue,
        seenCandidateValues,
        `${candidate.label}-drop-sendrecv`,
        strippedSendrecv,
        candidate.trickleCandidates
      );

      const strippedMsid = stripSdpLineByHint(candidate.value, "a=msid:");
      queueUniqueSdpCandidate(
        candidateQueue,
        seenCandidateValues,
        `${candidate.label}-drop-msid`,
        strippedMsid,
        candidate.trickleCandidates
      );
    }
  }

  const rawPreview = String(rawSdp || "")
    .slice(0, 420)
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  const rawTail = String(rawSdp || "")
    .slice(-280)
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  const message = String(lastError?.message || "setRemoteDescription fehlgeschlagen.");
  const tried = attemptedLabels.join(", ");
  const failureDigest = failureSummaries.slice(-8).join(" || ");
  throw new Error(
    `${contextLabel}: ${message}. SDP-Kandidaten: ${tried}. Fehler je Kandidat: ${failureDigest}. Antwortbeginn: ${rawPreview}. Antwortende: ${rawTail}`
  );
}

function buildRealtimeConnectPayload(offerSdp) {
  return {
    sdp: String(offerSdp || ""),
    mode: state.voiceMode,
    caseText: getActiveVoiceCaseText(),
    promptText: getPromptForKey(getRealtimePromptKey()),
    realtimeModel: selectOpenAiRealtimeModel(),
    realtimeVoice: OPENAI_REALTIME_DEFAULT_VOICE
  };
}

async function connectRealtimeViaUnified(peerConnection, payload) {
  const response = await fetchWithTimeout(
    "/api/voice-realtime-connect",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    },
    REALTIME_CONNECT_TIMEOUT_MS
  );
  const rawBodyText = await response.text();
  const body = parseJsonSafe(rawBodyText) || {};
  const rawSdp = body?.sdp || body?.answer_sdp || body?.answer || "";
  if (!response.ok || !String(rawSdp || "").trim()) {
    const message = String(body?.error || "Unified-Handshake fehlgeschlagen.");
    const detail = String(body?.details || "").trim();
    const statusDetail = `HTTP ${response.status}`;
    const responseSnippet = String(rawBodyText || "")
      .replace(/\s+/g, " ")
      .slice(0, 220);
    const combinedDetailParts = [detail, statusDetail, responseSnippet].filter(Boolean);
    const err = new Error(
      combinedDetailParts.length ? `${message} ${combinedDetailParts.join(" | ")}` : message
    );
    err.code = "REALTIME_UNIFIED_FAILED";
    throw err;
  }

  const sdpVariant = await setRemoteDescriptionWithSdpCandidates(
    peerConnection,
    rawSdp,
    "Unified-SDP ungueltig"
  );

  return {
    realtimeModel:
      body?.realtimeModel === OPENAI_REALTIME_MODEL_STRONG
        ? OPENAI_REALTIME_MODEL_STRONG
        : OPENAI_REALTIME_MODEL_FAST,
    pathLabel: `Unified-${sdpVariant}`
  };
}

async function connectRealtimeViaEphemeral(peerConnection, payload) {
  const tokenResponse = await fetchWithTimeout(
    "/api/voice-realtime-token",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    },
    REALTIME_CONNECT_TIMEOUT_MS
  );
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  const clientSecret = String(tokenBody?.value || "").trim();
  if (!tokenResponse.ok || !clientSecret) {
    const message = String(tokenBody?.error || "Ephemeral-Token fehlgeschlagen.");
    const detail = String(tokenBody?.details || "");
    const err = new Error(detail ? `${message} ${detail}` : message);
    err.code = "REALTIME_EPHEMERAL_TOKEN_FAILED";
    throw err;
  }

  const offerSdp = String(payload.sdp || "");
  const sessionForCalls = {
    type: "realtime",
    model:
      tokenBody?.realtimeModel === OPENAI_REALTIME_MODEL_STRONG
        ? OPENAI_REALTIME_MODEL_STRONG
        : OPENAI_REALTIME_MODEL_FAST,
    audio: {
      input: {
        turn_detection: {
          type: "server_vad"
        }
      },
      output: {
        voice: OPENAI_REALTIME_DEFAULT_VOICE
      }
    }
  };

  async function requestAnswerSdp(endpointUrl) {
    const formData = new FormData();
    formData.set("sdp", offerSdp);
    formData.set("session", JSON.stringify(sessionForCalls));

    const sdpResponse = await fetchWithTimeout(
      endpointUrl,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${clientSecret}`,
          accept: "application/sdp"
        },
        body: formData
      },
      REALTIME_CONNECT_TIMEOUT_MS
    );
    const rawAnswer = await sdpResponse.text();
    const responseContentType = String(sdpResponse.headers.get("content-type") || "").toLowerCase();
    const answerSdp = extractSdpFromResponseText(rawAnswer);
    if (!sdpResponse.ok || !answerSdp) {
      const err = new Error(
        `Ephemeral-SDP (calls) fehlgeschlagen (HTTP ${sdpResponse.status}, content-type: ${responseContentType}). ${String(
          rawAnswer || ""
        ).slice(0, 280)}`
      );
      err.code = "REALTIME_EPHEMERAL_SDP_FAILED";
      throw err;
    }
    return answerSdp;
  }

  const answerSdp = await requestAnswerSdp("https://api.openai.com/v1/realtime/calls");
  const sdpVariant = await setRemoteDescriptionWithSdpCandidates(
    peerConnection,
    answerSdp,
    "Ephemeral-SDP konnte nicht gesetzt werden"
  );

  return {
    realtimeModel:
      tokenBody?.realtimeModel === OPENAI_REALTIME_MODEL_STRONG
        ? OPENAI_REALTIME_MODEL_STRONG
        : OPENAI_REALTIME_MODEL_FAST,
    pathLabel: `Ephemeral-calls-${sdpVariant}`
  };
}

function openRealtimeWebSocketWithTimeout(url, protocols, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;
    let socket = null;

    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (socket) {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
        socket.removeEventListener("close", onClose);
      }
      handler(value);
    };

    const onOpen = () => finish(resolve, socket);
    const onError = () => finish(reject, new Error("Realtime WebSocket-Handshake fehlgeschlagen."));
    const onClose = (event) => {
      const code = Number(event?.code || 0);
      const reason = String(event?.reason || "").trim();
      finish(
        reject,
        new Error(
          `Realtime WebSocket wurde beim Verbindungsaufbau geschlossen (Code ${code}${
            reason ? `, ${reason}` : ""
          }).`
        )
      );
    };

    try {
      socket = new WebSocket(url, protocols);
    } catch (error) {
      reject(error);
      return;
    }

    socket.addEventListener("open", onOpen);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    timeoutId = window.setTimeout(() => {
      try {
        socket.close(1000, "connect-timeout");
      } catch {
        // ignore
      }
      finish(reject, new Error(`Realtime WebSocket-Timeout nach ${Math.round(timeoutMs / 1000)}s.`));
    }, timeoutMs);
  });
}

async function connectRealtimeViaWebSocket(payload) {
  const tokenResponse = await fetchWithTimeout(
    "/api/voice-realtime-token",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    },
    REALTIME_CONNECT_TIMEOUT_MS
  );
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  const clientSecret = String(tokenBody?.value || "").trim();
  if (!tokenResponse.ok || !clientSecret) {
    const message = String(tokenBody?.error || "Ephemeral-Token fehlgeschlagen.");
    const detail = String(tokenBody?.details || "");
    throw new Error(detail ? `${message} ${detail}` : message);
  }

  const realtimeModel =
    tokenBody?.realtimeModel === OPENAI_REALTIME_MODEL_STRONG
      ? OPENAI_REALTIME_MODEL_STRONG
      : OPENAI_REALTIME_MODEL_FAST;
  const wsUrl = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(realtimeModel)}`;
  const wsProtocolVariants = [["realtime", `openai-insecure-api-key.${clientSecret}`]];
  let socket = null;
  let lastWsError = null;
  for (const protocols of wsProtocolVariants) {
    try {
      socket = await openRealtimeWebSocketWithTimeout(wsUrl, protocols, REALTIME_CONNECT_TIMEOUT_MS);
      break;
    } catch (error) {
      lastWsError = error;
      console.warn("Realtime WebSocket-Protokollvariante fehlgeschlagen", { protocols, error });
    }
  }
  if (!socket) {
    throw new Error(
      `Realtime WebSocket konnte nicht aufgebaut werden: ${String(
        lastWsError?.message || "Unbekannter Fehler"
      )}`
    );
  }

  return {
    socket,
    realtimeModel,
    pathLabel: "WebSocket-ephemeral"
  };
}

async function startVoiceRealtimeSession() {
  state.voiceRealtimeConnecting = true;
  state.voiceRealtimeActive = false;
  state.voiceRealtimeMuted = false;
  state.voiceRealtimeModel = selectOpenAiRealtimeModel();
  realtimePendingUserText = "";
  realtimeUsageSeenResponseIds = new Set();
  updateVoiceRealtimeUi();
  setVoiceBusy(state.voiceBusy);
  setVoiceStatus("Realtime wird aufgebaut ...");

  try {
    if (REALTIME_TRANSPORT_MODE === "websocket") {
      const connectPayload = buildRealtimeConnectPayload("");
      setVoiceStatus("Realtime verbindet (WebSocket) ...");
      const connectResult = await connectRealtimeViaWebSocket(connectPayload);
      const socket = connectResult.socket;
      realtimeWebSocket = socket;
      realtimePeerConnection = null;
      realtimeLocalStream = null;
      realtimeDataChannel = null;

      socket.onmessage = (event) => {
        handleRealtimeEventMessage(event?.data);
      };
      socket.onerror = () => {
        if (socket !== realtimeWebSocket) return;
        setVoiceStatus("Realtime WebSocket: Verbindungsproblem erkannt.", true);
      };
      socket.onclose = (event) => {
        if (socket !== realtimeWebSocket) return;
        const closeCode = Number(event?.code || 0);
        const closeReason = String(event?.reason || "").trim();
        stopVoiceRealtimeSession({ preserveStatus: true, reason: "connection-lost", silent: true });
        setVoiceStatus(
          `Realtime WebSocket getrennt (Code ${closeCode}${closeReason ? `, ${closeReason}` : ""}).`,
          true
        );
      };

      state.voiceRealtimeConnecting = false;
      state.voiceRealtimeActive = true;
      state.voiceRealtimeMuted = false;
      state.voiceRealtimeModel = connectResult.realtimeModel;
      updateVoiceRealtimeUi();
      updateVoiceRecordButton();
      setVoiceBusy(state.voiceBusy);
      trackRealtimeSessionStart(state.voiceRealtimeModel);
      try {
        sendRealtimeDataEvent({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            audio: {
              input: {
                turn_detection: null
              },
              output: {
                voice: OPENAI_REALTIME_DEFAULT_VOICE
              }
            }
          }
        });
      } catch (error) {
        console.warn("Realtime session.update konnte nicht gesetzt werden", error);
      }

      if (isDoctorConversationMode()) {
        try {
          sendRealtimeDataEvent(buildRealtimeResponseCreateEvent());
        } catch (error) {
          console.warn("Realtime-Startantwort konnte nicht angefordert werden", error);
        }
      }

      setVoiceStatus(
        `Realtime verbunden (${state.voiceRealtimeModel}, ${connectResult.pathLabel}). Audio laeuft Ende-zu-Ende.`
      );
      return;
    }

    throw new Error("Realtime-Transport nicht unterstuetzt.");
  } catch (error) {
    console.error(error);
    stopVoiceRealtimeSession({ preserveStatus: true, silent: true });
    setVoiceStatus(
      `Realtime-Verbindung fehlgeschlagen: ${String(error?.message || "Unbekannter Fehler")}`,
      true
    );
  }
}

function stopVoiceRealtimeSession(options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  const silent = Boolean(options.silent);
  const reason = String(options.reason || "manual");

  state.voiceRealtimeConnecting = false;
  state.voiceRealtimeActive = false;
  state.voiceRealtimeMuted = false;
  state.voiceRealtimeModel = selectOpenAiRealtimeModel();
  realtimePendingUserText = "";
  realtimeUsageSeenResponseIds = new Set();

  const dataChannel = realtimeDataChannel;
  realtimeDataChannel = null;
  if (dataChannel) {
    try {
      dataChannel.onopen = null;
      dataChannel.onmessage = null;
      dataChannel.onerror = null;
      dataChannel.close();
    } catch {
      // ignore
    }
  }

  const realtimeSocket = realtimeWebSocket;
  realtimeWebSocket = null;
  if (realtimeSocket) {
    try {
      realtimeSocket.onopen = null;
      realtimeSocket.onmessage = null;
      realtimeSocket.onerror = null;
      realtimeSocket.onclose = null;
      if (realtimeSocket.readyState === WebSocket.OPEN || realtimeSocket.readyState === WebSocket.CONNECTING) {
        realtimeSocket.close(1000, "client-stop");
      }
    } catch {
      // ignore
    }
  }

  const peerConnection = realtimePeerConnection;
  realtimePeerConnection = null;
  if (peerConnection) {
    try {
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    } catch {
      // ignore
    }
  }

  const localStream = realtimeLocalStream;
  realtimeLocalStream = null;
  if (localStream) {
    for (const track of localStream.getTracks()) {
      track.stop();
    }
  }

  if (refs.voiceRealtimeAudio) {
    refs.voiceRealtimeAudio.pause();
    refs.voiceRealtimeAudio.srcObject = null;
    refs.voiceRealtimeAudio.classList.add("hidden");
  }
  resetRealtimeAudioPlayback();

  updateVoiceRealtimeUi();
  updateVoiceRecordButton();
  setVoiceBusy(state.voiceBusy);

  if (silent) return;
  if (preserveStatus) return;
  if (reason === "connection-lost") {
    setVoiceStatus("Realtime-Verbindung beendet.");
    return;
  }
  setVoiceStatus(buildVoiceReadyStatus());
}

function sendRealtimeDataEvent(eventBody) {
  if (realtimeDataChannel && realtimeDataChannel.readyState === "open") {
    realtimeDataChannel.send(JSON.stringify(eventBody));
    return;
  }
  if (realtimeWebSocket && realtimeWebSocket.readyState === WebSocket.OPEN) {
    realtimeWebSocket.send(JSON.stringify(eventBody));
    return;
  }
  throw new Error("Kein offener Realtime-Kanal verfuegbar.");
}

function sendRealtimeTextInput(text) {
  const userText = String(text || "")
    .trim()
    .slice(0, MAX_VOICE_QUESTION_LENGTH);
  if (!userText) return;
  realtimePendingUserText = userText;
  refs.voiceUserTranscript.textContent = userText;
  refs.voiceLastTurn.classList.remove("hidden");
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");
  sendRealtimeDataEvent({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: userText }]
    }
  });
  sendRealtimeDataEvent(buildRealtimeResponseCreateEvent());
}

function buildRealtimeResponseCreateEvent() {
  return {
    type: "response.create",
    response: {
      modalities: ["text", "audio"]
    }
  };
}

function sendRealtimeAudioInput(audioBase64) {
  const cleanAudio = stripDataUrlAudio(String(audioBase64 || ""))
    .replace(/\s+/g, "")
    .trim();
  if (!cleanAudio) {
    throw new Error("Leerer Audio-Input.");
  }
  realtimePendingUserText = "(Sprachbeitrag)";
  refs.voiceUserTranscript.textContent = "🎤 Sprachbeitrag gesendet";
  refs.voiceLastTurn.classList.remove("hidden");
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");

  for (let offset = 0; offset < cleanAudio.length; offset += REALTIME_AUDIO_CHUNK_BASE64_SIZE) {
    const chunk = cleanAudio.slice(offset, offset + REALTIME_AUDIO_CHUNK_BASE64_SIZE);
    if (!chunk) continue;
    sendRealtimeDataEvent({
      type: "input_audio_buffer.append",
      audio: chunk
    });
  }
  sendRealtimeDataEvent({
    type: "input_audio_buffer.commit"
  });
  sendRealtimeDataEvent(buildRealtimeResponseCreateEvent());
}

function handleRealtimeEventMessage(rawData) {
  let eventPayload = null;
  try {
    eventPayload = typeof rawData === "string" ? JSON.parse(rawData) : null;
  } catch {
    return;
  }
  if (!eventPayload || typeof eventPayload !== "object") return;
  trackRealtimeUsageFromEvent(eventPayload);

  if (String(eventPayload.type || "") === "error") {
    const message = String(eventPayload?.error?.message || "Realtime-Fehler.");
    setVoiceStatus(`Realtime-Fehler: ${message}`, true);
    return;
  }

  const userText = extractRealtimeUserText(eventPayload);
  if (userText) {
    realtimePendingUserText = userText;
    refs.voiceUserTranscript.textContent = userText;
    refs.voiceLastTurn.classList.remove("hidden");
  }

  const assistantAudioDelta = extractRealtimeAssistantAudioDelta(eventPayload);
  if (assistantAudioDelta) {
    void enqueueRealtimeAssistantAudio(assistantAudioDelta);
  }

  const assistantText = extractRealtimeAssistantText(eventPayload);
  if (assistantText) {
    refs.voiceAssistantReply.textContent = assistantText;
    refs.voiceLastTurn.classList.remove("hidden");
    refs.voiceCoachHint.textContent = "";
    refs.voiceCoachHint.classList.add("hidden");
    appendRealtimeConversationTurn(realtimePendingUserText, assistantText);
    realtimePendingUserText = "";
    setVoiceStatus("Realtime-Antwort erhalten. Du kannst direkt fortfahren.");
  }
}

function extractRealtimeUserText(eventPayload) {
  const eventType = String(eventPayload?.type || "");
  if (eventType.includes("input_audio_transcription")) {
    return normalizeRealtimeSnippet(eventPayload?.transcript);
  }
  if (eventType === "conversation.item.created" && String(eventPayload?.item?.role || "") === "user") {
    return extractRealtimeContentText(eventPayload?.item?.content);
  }
  return "";
}

function extractRealtimeAssistantText(eventPayload) {
  const eventType = String(eventPayload?.type || "");
  if (eventType === "response.audio_transcript.done") {
    return normalizeRealtimeSnippet(eventPayload?.transcript);
  }
  if (eventType === "response.output_text.done" || eventType === "response.text.done") {
    return normalizeRealtimeSnippet(eventPayload?.text || eventPayload?.transcript || "");
  }
  if (
    eventType === "conversation.item.created" &&
    String(eventPayload?.item?.role || "") === "assistant"
  ) {
    return extractRealtimeContentText(eventPayload?.item?.content);
  }
  if (eventType === "response.done") {
    return extractRealtimeTextFromResponseDone(eventPayload?.response);
  }
  return "";
}

function extractRealtimeAssistantAudioDelta(eventPayload) {
  const eventType = String(eventPayload?.type || "");
  if (eventType === "response.audio.delta" || eventType === "response.output_audio.delta") {
    return typeof eventPayload?.delta === "string" ? eventPayload.delta.trim() : "";
  }
  return "";
}

function extractRealtimeTextFromResponseDone(responsePayload) {
  const output = Array.isArray(responsePayload?.output) ? responsePayload.output : [];
  for (const item of output) {
    const text = extractRealtimeContentText(item?.content);
    if (text) return text;
  }
  return "";
}

function extractRealtimeContentText(contentValue) {
  if (!Array.isArray(contentValue)) return "";
  for (const item of contentValue) {
    const directText = normalizeRealtimeSnippet(item?.text || item?.transcript || item?.value || "");
    if (directText) return directText;
  }
  return "";
}

function normalizeRealtimeSnippet(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.slice(0, 1_100);
}

function appendRealtimeConversationTurn(userText, assistantText) {
  const user = normalizeRealtimeSnippet(userText);
  const assistant = normalizeRealtimeSnippet(assistantText);
  if (!user && !assistant) return;
  if (isDoctorConversationMode()) {
    state.voiceDoctorConversationHistory = [
      ...state.voiceDoctorConversationHistory,
      { user, assistant }
    ].slice(-MAX_VOICE_HISTORY_TURNS);
    return;
  }
  state.voiceHistory = [...state.voiceHistory, { user, assistant }].slice(-MAX_VOICE_HISTORY_TURNS);
}

async function handleVoiceTextSend() {
  if (state.voiceBusy) return;
  if (state.voiceRecording) {
    setVoiceStatus("Bitte zuerst die laufende Aufnahme stoppen.", true);
    return;
  }

  if (state.voiceRealtimeActive) {
    const learnerText = String(refs.voiceTextInput?.value || "")
      .trim()
      .slice(0, MAX_VOICE_QUESTION_LENGTH);
    if (!learnerText) {
      setVoiceStatus("Bitte zuerst einen Text eingeben.", true);
      refs.voiceTextInput?.focus();
      return;
    }
    try {
      sendRealtimeTextInput(learnerText);
      refs.voiceTextInput.value = "";
      setVoiceStatus("Text an die Realtime-Sitzung gesendet.");
    } catch (error) {
      setVoiceStatus(
        `Realtime-Text konnte nicht gesendet werden: ${String(error?.message || "Unbekannter Fehler")}`,
        true
      );
      console.error(error);
    }
    return;
  }

  const learnerText = String(refs.voiceTextInput?.value || "")
    .trim()
    .slice(0, MAX_VOICE_QUESTION_LENGTH);
  if (!learnerText) {
    setVoiceStatus(
      isDiagnosisMode()
        ? "Bitte zuerst eine Diagnose als Text eingeben."
        : isDoctorConversationMode()
          ? "Bitte zuerst eine strukturierte Fallvorstellung oder Antwort als Text eingeben."
          : "Bitte zuerst eine Frage als Text eingeben.",
      true
    );
    refs.voiceTextInput?.focus();
    return;
  }

  try {
    setVoiceBusy(true);
    if (isDiagnosisMode()) {
      clearVoiceDoctorConversationEvaluationReport();
      setVoiceStatus("Sende Diagnose und starte Gesamtbewertung ...");
      await runVoiceEvaluation({ diagnosisText: learnerText });
    } else if (isDoctorConversationMode()) {
      clearVoiceEvaluationReport();
      clearDoctorLetterEvaluationReport();
      clearVoiceDoctorConversationEvaluationReport();
      setVoiceStatus("Sende Bericht und starte Arzt-Arzt-Gespraech ...");
      await runVoiceDoctorConversationTurn({ learnerText });
    } else {
      clearVoiceEvaluationReport();
      clearDoctorLetterEvaluationReport();
      clearVoiceDoctorConversationEvaluationReport();
      setVoiceStatus("Sende Textfrage und simuliere Patientenantwort ...");
      await runVoiceTurn({ learnerText });
    }
    if (refs.voiceTextInput) {
      refs.voiceTextInput.value = "";
    }
  } catch (error) {
    setVoiceStatus(
      isDiagnosisMode()
        ? "Anamnese-Bewertung fehlgeschlagen. Bitte erneut versuchen."
        : isDoctorConversationMode()
          ? "Arzt-Arzt-Gespraech fehlgeschlagen. Bitte erneut versuchen."
        : "Text-Turn fehlgeschlagen. Bitte erneut versuchen.",
      true
    );
    console.error(error);
  } finally {
    setVoiceBusy(false);
  }
}

async function handleVoiceNextCase() {
  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    setVoiceStatus("Bitte zuerst das Realtime-Gespraech beenden, dann den naechsten Fall laden.", true);
    return;
  }
  const loaded = await ensureVoiceCaseLibraryLoaded();
  if (!loaded || state.voiceCaseLibrary.length === 0) {
    setVoiceStatus("Fallbibliothek konnte nicht geladen werden. Bitte spaeter erneut versuchen.", true);
    return;
  }

  const currentSelection = getActiveVoiceCaseSelection();
  const currentIndex = state.voiceCaseLibrary.findIndex(
    (entry) => `${VOICE_CASE_LIBRARY_PREFIX}${entry.id}` === currentSelection
  );
  const nextIndex = (currentIndex + 1) % state.voiceCaseLibrary.length;
  const nextEntry = state.voiceCaseLibrary[nextIndex];
  if (!nextEntry || !nextEntry.id) {
    setVoiceStatus("Ausgewaehlter Fall ist leer. Bitte erneut versuchen.", true);
    return;
  }

  const nextSelection = `${VOICE_CASE_LIBRARY_PREFIX}${nextEntry.id}`;
  applyVoiceCaseSelection(nextSelection, { preserveStatus: false, resetConversation: true });
  applyVoiceMode(VOICE_MODE_QUESTION, { preserveStatus: false });
}

function renderVoiceCaseSelect() {
  if (!refs.voiceCaseSelect) return;

  const currentSelection = getActiveVoiceCaseSelection();
  refs.voiceCaseSelect.innerHTML = "";

  for (const [index, entry] of state.voiceCaseLibrary.entries()) {
    addVoiceCaseOption(`${VOICE_CASE_LIBRARY_PREFIX}${entry.id}`, String(index + 1));
  }

  if (state.voiceCaseLibrary.length === 0) {
    addVoiceCaseOption(VOICE_CASE_DEFAULT, "1");
  }

  const fallbackSelection =
    state.voiceCaseLibrary.length > 0
      ? `${VOICE_CASE_LIBRARY_PREFIX}${state.voiceCaseLibrary[0].id}`
      : VOICE_CASE_DEFAULT;
  const hasCurrentOption = Array.from(refs.voiceCaseSelect.options || []).some(
    (option) => option.value === currentSelection
  );
  if (isValidVoiceCaseSelection(currentSelection) && hasCurrentOption) {
    refs.voiceCaseSelect.value = currentSelection;
  } else {
    refs.voiceCaseSelect.value = fallbackSelection;
  }
}

function addVoiceCaseOption(value, label) {
  if (!refs.voiceCaseSelect) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  refs.voiceCaseSelect.appendChild(option);
}

function getActiveVoiceCaseSelection() {
  if (state.voiceCaseSelection === VOICE_CASE_CUSTOM) {
    return VOICE_CASE_CUSTOM;
  }
  if (refs.voiceCaseSelect && refs.voiceCaseSelect.value) {
    return refs.voiceCaseSelect.value;
  }
  if (typeof state.voiceCaseSelection === "string" && state.voiceCaseSelection) {
    return state.voiceCaseSelection;
  }
  return VOICE_CASE_DEFAULT;
}

function isValidVoiceCaseSelection(selection) {
  if (selection === VOICE_CASE_CUSTOM) {
    return true;
  }
  if (selection === VOICE_CASE_DEFAULT) {
    return !state.voiceCaseLibraryLoaded || state.voiceCaseLibrary.length === 0;
  }
  if (!selection) {
    return false;
  }
  if (!selection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    return false;
  }
  if (!state.voiceCaseLibraryLoaded) {
    return true;
  }
  return state.voiceCaseLibrary.some((entry) => `${VOICE_CASE_LIBRARY_PREFIX}${entry.id}` === selection);
}

function applyVoiceCaseSelection(selection, options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  const resetConversation = options.resetConversation !== false;

  const fallbackSelection =
    state.voiceCaseLibrary.length > 0
      ? `${VOICE_CASE_LIBRARY_PREFIX}${state.voiceCaseLibrary[0].id}`
      : VOICE_CASE_DEFAULT;
  const normalizedSelection = isValidVoiceCaseSelection(selection) ? selection : fallbackSelection;
  state.voiceCaseSelection = normalizedSelection;

  if (
    refs.voiceCaseSelect &&
    Array.from(refs.voiceCaseSelect.options || []).some((option) => option.value === normalizedSelection) &&
    refs.voiceCaseSelect.value !== normalizedSelection
  ) {
    refs.voiceCaseSelect.value = normalizedSelection;
  }

  saveToStorage(STORAGE_VOICE_CASE_SELECTION_KEY, { selection: normalizedSelection });

  const customMode = normalizedSelection === VOICE_CASE_CUSTOM;
  refs.voiceCaseInput.disabled = !customMode;
  if (!customMode) {
    refs.voiceCaseInput.placeholder =
      "Nicht aktiv. Dieser Text wird erst genutzt, wenn ein eigener Fall erstellt wird.";
  } else {
    refs.voiceCaseInput.placeholder = "Eigener Falltext aktiv.";
  }

  if (normalizedSelection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    const selectedId = normalizedSelection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
    state.voiceCaseIndex = state.voiceCaseLibrary.findIndex((entry) => entry.id === selectedId);
  } else {
    state.voiceCaseIndex = -1;
  }

  updateVoiceCaseMeta();
  updateVoiceCaseResolution();
  updateVoiceCaseInfoPanel();
  updateVoiceSamplePanel();
  if (resetConversation) {
    resetVoiceConversation({ keepCaseText: true, preserveStatus: true });
  }

  if (!preserveStatus) {
    setVoiceStatus(buildVoiceReadyStatus());
  }
}

function updateVoiceCaseInfoPanel() {
  if (!refs.voiceCaseInfoText) return;
  const caseText = String(getActiveVoiceCaseText() || "").trim();
  refs.voiceCaseInfoText.textContent = caseText || "Keine Fallinformationen vorhanden.";
}

function updateVoiceCaseMeta() {
  if (!refs.voiceCaseMeta) return;
  refs.voiceCaseMeta.textContent = `Aktiv: ${getVoiceCaseStatusLabel()}`;
}

function getVoiceCaseStatusLabel() {
  const selection = getActiveVoiceCaseSelection();
  if (selection === VOICE_CASE_CUSTOM) {
    return "Eigener Text";
  }
  if (selection === VOICE_CASE_DEFAULT) {
    return "Fall 1";
  }

  const selectedId = selection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
  const entryIndex = state.voiceCaseLibrary.findIndex((item) => item.id === selectedId);
  const entry = entryIndex >= 0 ? state.voiceCaseLibrary[entryIndex] : null;
  if (!entry) {
    if (!state.voiceCaseLibraryLoaded) {
      return "Fallbibliothek wird geladen";
    }
    return "Fall 1";
  }
  return `Fall ${entryIndex + 1}`;
}

function getActiveVoiceCaseId() {
  const selection = getActiveVoiceCaseSelection();
  if (selection === VOICE_CASE_DEFAULT) {
    return extractCaseId(DEFAULT_VOICE_CASE) || "default_thoraxschmerz_001";
  }
  if (selection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    return selection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
  }
  if (selection === VOICE_CASE_CUSTOM) {
    const customId = extractCaseId(refs.voiceCaseInput.value || "");
    return customId || "";
  }
  return "";
}

async function ensureVoiceCaseSampleLibraryLoaded() {
  if (state.voiceCaseSamplesLoaded) {
    return true;
  }

  try {
    const url = new URL(`../${VOICE_CASE_SAMPLE_PATH}?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("voice-case-sample-fetch-failed");
    }

    const raw = await response.json();
    if (!raw || typeof raw !== "object") {
      throw new Error("voice-case-sample-invalid-json");
    }

    state.voiceCaseSamples = raw;
    state.voiceCaseSamplesLoaded = true;
    updateVoiceSamplePanel();
    return true;
  } catch (error) {
    console.warn("Mustertexte konnten nicht geladen werden", error);
    state.voiceCaseSamples = {};
    state.voiceCaseSamplesLoaded = true;
    updateVoiceSamplePanel();
    return false;
  }
}

async function ensureVoiceCaseResolutionLibraryLoaded() {
  if (state.voiceCaseResolutionsLoaded) {
    return true;
  }

  try {
    const url = new URL(`../${VOICE_CASE_RESOLUTION_PATH}?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("voice-case-resolution-fetch-failed");
    }

    const raw = await response.json();
    if (!raw || typeof raw !== "object") {
      throw new Error("voice-case-resolution-invalid-json");
    }
    state.voiceCaseResolutions = raw;
    state.voiceCaseResolutionsLoaded = true;
    updateVoiceCaseResolution();
    return true;
  } catch (error) {
    console.warn("Fallaufloesungen konnten nicht geladen werden", error);
    state.voiceCaseResolutions = {};
    state.voiceCaseResolutionsLoaded = true;
    updateVoiceCaseResolution();
    return false;
  }
}

function updateVoiceCaseResolution() {
  if (
    !refs.voiceResolutionTitle ||
    !refs.voiceResolutionHint ||
    !refs.voiceResolutionSummary ||
    !refs.voiceResolutionQuestions ||
    !refs.voiceResolutionTerms ||
    !refs.voiceResolutionDiagnoses
  ) {
    return;
  }

  if (!state.voiceCaseResolutionsLoaded) {
    refs.voiceResolutionTitle.textContent = "Fall aufloesen";
    refs.voiceResolutionHint.textContent = "Aufloesung wird geladen ...";
    refs.voiceResolutionSummary.textContent = "";
    renderVoiceResolutionList(refs.voiceResolutionQuestions, []);
    renderVoiceResolutionList(refs.voiceResolutionTerms, []);
    renderVoiceResolutionList(refs.voiceResolutionDiagnoses, []);
    return;
  }

  const activeCaseId = getActiveVoiceCaseId();
  const entry = activeCaseId ? state.voiceCaseResolutions[activeCaseId] : null;
  if (!entry) {
    if (getActiveVoiceCaseSelection() === VOICE_CASE_CUSTOM) {
      refs.voiceResolutionTitle.textContent = "Fall aufloesen";
      refs.voiceResolutionHint.textContent =
        "Fuer eigenen Falltext gibt es noch keine hinterlegte Aufloesung. Nutze einen Bibliotheksfall fuer strukturierte Loesungen.";
    } else {
      refs.voiceResolutionTitle.textContent = "Fall aufloesen";
      refs.voiceResolutionHint.textContent = "Fuer diesen Fall ist noch keine Aufloesung hinterlegt.";
    }
    refs.voiceResolutionSummary.textContent = "";
    renderVoiceResolutionList(refs.voiceResolutionQuestions, []);
    renderVoiceResolutionList(refs.voiceResolutionTerms, []);
    renderVoiceResolutionList(refs.voiceResolutionDiagnoses, []);
    return;
  }

  refs.voiceResolutionTitle.textContent = entry.title || "Fall aufloesen";
  refs.voiceResolutionHint.textContent = `CASE_ID: ${activeCaseId}`;
  refs.voiceResolutionSummary.textContent = entry.summary || "";
  renderVoiceResolutionList(refs.voiceResolutionQuestions, Array.isArray(entry.questions) ? entry.questions : []);
  renderVoiceResolutionList(refs.voiceResolutionTerms, Array.isArray(entry.terms) ? entry.terms : []);
  renderVoiceResolutionList(
    refs.voiceResolutionDiagnoses,
    Array.isArray(entry.diagnoses) ? entry.diagnoses : []
  );
}

function renderVoiceResolutionList(container, items) {
  if (!container) return;
  container.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "-";
    container.appendChild(empty);
    return;
  }
  for (const item of items) {
    const value = String(item || "").trim();
    if (!value) continue;
    const li = document.createElement("li");
    li.textContent = value;
    container.appendChild(li);
  }
  if (!container.children.length) {
    const empty = document.createElement("li");
    empty.textContent = "-";
    container.appendChild(empty);
  }
}

async function startVoiceRecording() {
  if (!isVoiceCaptureSupported()) {
    setVoiceStatus("Mikrofon-Aufnahme ist hier leider nicht verfuegbar.", true);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickRecordingMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    activeMediaRecorder = recorder;
    activeMediaStream = stream;
    voiceChunkBuffer = [];
    shouldSendVoiceAfterStop = true;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        voiceChunkBuffer.push(event.data);
      }
    };

    recorder.onerror = () => {
      setVoiceStatus("Aufnahmefehler. Bitte erneut versuchen.", true);
      cleanupVoiceMedia();
      state.voiceRecording = false;
      updateVoiceRecordButton();
    };

    recorder.onstop = () => {
      const sendAfterStop = shouldSendVoiceAfterStop;
      shouldSendVoiceAfterStop = false;
      const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
      cleanupVoiceMedia();
      void finalizeVoiceRecording(sendAfterStop, finalMimeType);
    };

    recorder.start(250);
    state.voiceRecording = true;
    updateVoiceRecordButton();
    setVoiceStatus(
      isDiagnosisMode()
        ? "Diagnose-Aufnahme laeuft ... tippe erneut, um zu stoppen und zu bewerten."
        : state.voiceRealtimeActive
          ? isDoctorConversationMode()
            ? "Realtime-Aufnahme laeuft ... tippe erneut, um an den Prueferarzt zu senden."
            : "Realtime-Aufnahme laeuft ... tippe erneut, um an die Patientensimulation zu senden."
        : isDoctorConversationMode()
          ? "Bericht-Aufnahme laeuft ... tippe erneut, um zu stoppen und Rueckfrage zu erhalten."
        : "Aufnahme laeuft ... tippe erneut, um zu stoppen und an die KI zu senden."
    );

    if (voiceAutoStopTimer) {
      window.clearTimeout(voiceAutoStopTimer);
    }
    voiceAutoStopTimer = window.setTimeout(() => {
      if (!state.voiceRecording) return;
      stopVoiceRecording(true, "auto-stop");
    }, MAX_VOICE_RECORD_MS);
  } catch (error) {
    setVoiceStatus(
      "Mikrofon konnte nicht gestartet werden. Bitte Browser-Berechtigung pruefen.",
      true
    );
    cleanupVoiceMedia();
    state.voiceRecording = false;
    updateVoiceRecordButton();
    console.error(error);
  }
}

function stopVoiceRecording(sendToAi, reason) {
  shouldSendVoiceAfterStop = Boolean(sendToAi);
  state.voiceRecording = false;
  updateVoiceRecordButton();

  if (voiceAutoStopTimer) {
    window.clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = null;
  }

  if (reason === "auto-stop") {
    setVoiceStatus("Maximale Aufnahmedauer erreicht. Audio wird jetzt verarbeitet ...");
  } else if (sendToAi) {
    setVoiceStatus(
      isDiagnosisMode()
        ? "Verarbeite Diagnose-Audio ..."
        : state.voiceRealtimeActive
          ? "Transkribiere Realtime-Audio und sende an die KI ..."
        : isDoctorConversationMode()
          ? "Verarbeite Bericht-Audio ..."
          : "Verarbeite Aufnahme ..."
    );
  } else {
    setVoiceStatus("Aufnahme verworfen.");
  }

  if (!activeMediaRecorder) {
    cleanupVoiceMedia();
    return;
  }

  if (activeMediaRecorder.state !== "inactive") {
    activeMediaRecorder.stop();
  } else {
    cleanupVoiceMedia();
  }
}

async function finalizeVoiceRecording(sendToAi, mimeType) {
  const chunks = [...voiceChunkBuffer];
  voiceChunkBuffer = [];
  if (!sendToAi) {
    return;
  }

  if (!chunks.length) {
    setVoiceStatus("Es wurde kein Audio erkannt. Bitte erneut sprechen.", true);
    return;
  }

  const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
  if (blob.size < MIN_VOICE_BLOB_BYTES) {
    setVoiceStatus("Audio war zu kurz. Bitte etwas laenger sprechen.", true);
    return;
  }

  try {
    setVoiceBusy(true);
    const audioBase64 = await blobToBase64(blob);
    if (state.voiceRealtimeActive) {
      setVoiceStatus("Sende Realtime-Audio direkt an die KI ...");
      sendRealtimeAudioInput(audioBase64);
      if (refs.voiceTextInput) {
        refs.voiceTextInput.value = "";
      }
      setVoiceStatus("Realtime-Sprachbeitrag gesendet. Warte auf Antwort ...");
      return;
    }
    setVoiceStatus(
      isDiagnosisMode()
        ? "Transkribiere Diagnose und erstelle Bewertung ..."
        : isDoctorConversationMode()
          ? "Transkribiere Bericht und simuliere pruefende Rueckfrage ..."
        : "Transkribiere und simuliere Patientenantwort ..."
    );
    if (isDiagnosisMode()) {
      await runVoiceEvaluation({ audioBase64 });
    } else if (isDoctorConversationMode()) {
      clearVoiceEvaluationReport();
      clearDoctorLetterEvaluationReport();
      await runVoiceDoctorConversationTurn({ audioBase64 });
    } else {
      clearVoiceEvaluationReport();
      clearDoctorLetterEvaluationReport();
      await runVoiceTurn({ audioBase64 });
    }
  } catch (error) {
    setVoiceStatus(
      state.voiceRealtimeActive
        ? "Realtime-Sprachbeitrag fehlgeschlagen. Bitte erneut versuchen."
        : isDiagnosisMode()
        ? "Anamnese-Bewertung fehlgeschlagen. Bitte erneut versuchen."
        : isDoctorConversationMode()
          ? "Arzt-Arzt-Gespraech fehlgeschlagen. Bitte erneut versuchen."
        : "Voice-Turn fehlgeschlagen. Bitte erneut versuchen.",
      true
    );
    console.error(error);
  } finally {
    setVoiceBusy(false);
  }
}

async function runDoctorLetterEvaluation(doctorLetterText) {
  const response = await fetch("/api/doctor-letter-evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseText: getActiveVoiceCaseText(),
      history: state.voiceHistory,
      doctorLetterText,
      chatModel: normalizeVoiceModel(state.voiceModel),
      systemPromptOverride: getPromptForKey("doctorLetterEvaluate")
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.evaluation) {
    throw new Error(payload.error || "API Fehler");
  }
  return payload.evaluation;
}

async function runVoiceDoctorConversationEvaluation() {
  const response = await fetch("/api/voice-doctor-evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseText: getActiveVoiceCaseText(),
      history: state.voiceDoctorConversationHistory,
      chatModel: normalizeVoiceModel(state.voiceModel),
      systemPromptOverride: getPromptForKey("voiceDoctorEvaluate")
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.evaluation) {
    throw new Error(payload.error || "API Fehler");
  }
  return payload.evaluation;
}

function renderDoctorLetterEvaluationReport(report) {
  if (
    !refs.voiceDoctorLetterEvalPanel ||
    !refs.voiceDoctorLetterEvalScore ||
    !refs.voiceDoctorLetterEvalPass ||
    !refs.voiceDoctorLetterEvalRecommendation ||
    !refs.voiceDoctorLetterEvalCriteria
  ) {
    return;
  }

  refs.voiceDoctorLetterEvalScore.textContent = `Gesamt: ${String(report.total_score || "0")} / 20`;
  refs.voiceDoctorLetterEvalPass.textContent =
    Number(report.total_score) >= 12
      ? "Leistungsniveau: voraussichtlich bestanden (>= 12 Punkte)."
      : "Leistungsniveau: voraussichtlich nicht bestanden (< 12 Punkte).";
  refs.voiceDoctorLetterEvalRecommendation.textContent = String(report.recommendation || "");

  const criteria = Array.isArray(report.criteria) ? report.criteria : [];
  refs.voiceDoctorLetterEvalCriteria.innerHTML = "";
  for (const item of criteria) {
    const p = document.createElement("p");
    const label = String(item?.name || "Kriterium");
    const score = String(item?.score ?? "0");
    const justification = String(item?.justification || "");
    p.textContent = `${label}: ${score} Punkte. ${justification}`;
    refs.voiceDoctorLetterEvalCriteria.appendChild(p);
  }

  refs.voiceDoctorLetterEvalPanel.classList.remove("hidden");
}

function clearDoctorLetterEvaluationReport() {
  refs.voiceDoctorLetterEvalPanel?.classList.add("hidden");
  if (refs.voiceDoctorLetterEvalScore) refs.voiceDoctorLetterEvalScore.textContent = "";
  if (refs.voiceDoctorLetterEvalPass) refs.voiceDoctorLetterEvalPass.textContent = "";
  if (refs.voiceDoctorLetterEvalRecommendation) refs.voiceDoctorLetterEvalRecommendation.textContent = "";
  if (refs.voiceDoctorLetterEvalCriteria) refs.voiceDoctorLetterEvalCriteria.innerHTML = "";
}

function renderVoiceDoctorConversationEvaluationReport(report) {
  if (
    !refs.voiceDoctorConversationEvalPanel ||
    !refs.voiceDoctorConversationEvalScore ||
    !refs.voiceDoctorConversationEvalPass ||
    !refs.voiceDoctorConversationEvalSummary ||
    !refs.voiceDoctorConversationEvalRecommendation ||
    !refs.voiceDoctorConversationEvalDetailed ||
    !refs.voiceDoctorConversationEvalCriteria
  ) {
    return;
  }

  refs.voiceDoctorConversationEvalScore.textContent = `Gesamt: ${formatScoreWithMax(
    report.total_score,
    20
  )}`;
  refs.voiceDoctorConversationEvalPass.textContent = String(report.pass_assessment || "");
  refs.voiceDoctorConversationEvalSummary.textContent = String(report.summary_feedback || "");
  refs.voiceDoctorConversationEvalRecommendation.textContent = String(report.recommendation || "");
  refs.voiceDoctorConversationEvalDetailed.textContent = String(report.detailed_feedback_text || "");

  const criteria = Array.isArray(report.criteria) ? report.criteria : [];
  refs.voiceDoctorConversationEvalCriteria.innerHTML = "";
  for (const item of criteria) {
    const p = document.createElement("p");
    const name = String(item?.name || "Kriterium");
    const score = formatScoreForUi(item?.score);
    const justification = String(item?.justification || "");
    p.textContent = `${name}: ${score} Punkte. ${justification}`;
    refs.voiceDoctorConversationEvalCriteria.appendChild(p);
  }

  refs.voiceDoctorConversationEvalPanel.classList.remove("hidden");
}

function clearVoiceDoctorConversationEvaluationReport() {
  refs.voiceDoctorConversationEvalPanel?.classList.add("hidden");
  if (refs.voiceDoctorConversationEvalScore) refs.voiceDoctorConversationEvalScore.textContent = "";
  if (refs.voiceDoctorConversationEvalPass) refs.voiceDoctorConversationEvalPass.textContent = "";
  if (refs.voiceDoctorConversationEvalSummary) refs.voiceDoctorConversationEvalSummary.textContent = "";
  if (refs.voiceDoctorConversationEvalRecommendation) refs.voiceDoctorConversationEvalRecommendation.textContent = "";
  if (refs.voiceDoctorConversationEvalDetailed) refs.voiceDoctorConversationEvalDetailed.textContent = "";
  if (refs.voiceDoctorConversationEvalCriteria) refs.voiceDoctorConversationEvalCriteria.innerHTML = "";
}

async function runVoiceTurn(turnInput) {
  const audioBase64 = typeof turnInput?.audioBase64 === "string" ? turnInput.audioBase64 : "";
  const learnerText = typeof turnInput?.learnerText === "string" ? turnInput.learnerText : "";
  const caseText = getActiveVoiceCaseText();
  const requestBody = {
    caseText,
    history: state.voiceHistory,
    chatModel: normalizeVoiceModel(state.voiceModel),
    preferLocalTts: canUseLocalGermanTts(),
    systemPromptOverride: getPromptForKey("voiceTurn")
  };
  if (audioBase64) {
    requestBody.audioBase64 = audioBase64;
  }
  if (learnerText) {
    requestBody.learnerText = learnerText;
  }

  const response = await fetch("/api/voice-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "API Fehler");
  }

  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  const patientReply = typeof payload.patientReply === "string" ? payload.patientReply.trim() : "";
  const offTopic = Boolean(payload.offTopic);

  if (Array.isArray(payload.history)) {
    state.voiceHistory = payload.history.slice(-MAX_VOICE_HISTORY_TURNS);
  } else if (transcript || patientReply) {
    state.voiceHistory = [...state.voiceHistory, { user: transcript, assistant: patientReply }].slice(
      -MAX_VOICE_HISTORY_TURNS
    );
  }

  refs.voiceUserTranscript.textContent = transcript || "Keine Transkription.";
  refs.voiceAssistantReply.textContent = patientReply || "Keine Antwort erhalten.";
  refs.voiceLastTurn.classList.remove("hidden");

  // Keep only the patient role visible in v1 voice practice.
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");

  const localTtsStarted = speakWithLocalGermanVoice(patientReply);
  if (localTtsStarted) {
    refs.voiceReplyAudio.pause();
    refs.voiceReplyAudio.removeAttribute("src");
    refs.voiceReplyAudio.classList.add("hidden");
  } else {
    const audioSrc = buildReplyAudioSrc(payload.replyAudioBase64);
    if (audioSrc) {
      refs.voiceReplyAudio.src = audioSrc;
      refs.voiceReplyAudio.classList.remove("hidden");
      try {
        await refs.voiceReplyAudio.play();
      } catch {
        // autoplay may be blocked; controls are visible as fallback.
      }
    } else {
      refs.voiceReplyAudio.removeAttribute("src");
      refs.voiceReplyAudio.classList.add("hidden");
    }
  }

  if (offTopic) {
    setVoiceStatus("Antwort da. Hinweis: Die letzte Frage war teilweise off-topic.");
    return;
  }
  if (localTtsStarted) {
    setVoiceStatus("Antwort da. Wiedergabe mit lokaler deutscher Stimme. Du kannst direkt weiterfragen.");
    return;
  }
  setVoiceStatus("Antwort da. Du kannst direkt weiterfragen (Voice oder Text).");
}

async function runVoiceDoctorConversationTurn(turnInput) {
  const audioBase64 = typeof turnInput?.audioBase64 === "string" ? turnInput.audioBase64 : "";
  const learnerText = typeof turnInput?.learnerText === "string" ? turnInput.learnerText : "";
  const caseText = getActiveVoiceCaseText();
  const requestBody = {
    caseText,
    history: state.voiceDoctorConversationHistory,
    chatModel: normalizeVoiceModel(state.voiceModel),
    preferLocalTts: canUseLocalGermanTts(),
    systemPromptOverride: getPromptForKey("voiceDoctorTurn")
  };
  if (audioBase64) {
    requestBody.audioBase64 = audioBase64;
  }
  if (learnerText) {
    requestBody.learnerText = learnerText;
  }

  const response = await fetch("/api/voice-doctor-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "API Fehler");
  }

  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  const examinerReply = typeof payload.examinerReply === "string" ? payload.examinerReply.trim() : "";
  const offTopic = Boolean(payload.offTopic);

  if (Array.isArray(payload.history)) {
    state.voiceDoctorConversationHistory = payload.history.slice(-MAX_VOICE_HISTORY_TURNS);
  } else if (transcript || examinerReply) {
    state.voiceDoctorConversationHistory = [
      ...state.voiceDoctorConversationHistory,
      { user: transcript, assistant: examinerReply }
    ].slice(-MAX_VOICE_HISTORY_TURNS);
  }

  refs.voiceUserTranscript.textContent = transcript || "Keine Transkription.";
  refs.voiceAssistantReply.textContent = examinerReply || "Keine Rueckfrage erhalten.";
  refs.voiceLastTurn.classList.remove("hidden");

  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");

  const localTtsStarted = speakWithLocalGermanVoice(examinerReply);
  if (localTtsStarted) {
    refs.voiceReplyAudio.pause();
    refs.voiceReplyAudio.removeAttribute("src");
    refs.voiceReplyAudio.classList.add("hidden");
  } else {
    const audioSrc = buildReplyAudioSrc(payload.replyAudioBase64);
    if (audioSrc) {
      refs.voiceReplyAudio.src = audioSrc;
      refs.voiceReplyAudio.classList.remove("hidden");
      try {
        await refs.voiceReplyAudio.play();
      } catch {
        // autoplay may be blocked; controls are visible as fallback.
      }
    } else {
      refs.voiceReplyAudio.removeAttribute("src");
      refs.voiceReplyAudio.classList.add("hidden");
    }
  }

  if (offTopic) {
    setVoiceStatus("Rueckfrage da. Hinweis: Bitte die Fallvorstellung enger am klinischen Kern halten.");
    return;
  }
  if (localTtsStarted) {
    setVoiceStatus("Rueckfrage da. Wiedergabe mit lokaler deutscher Stimme. Du kannst direkt antworten.");
    return;
  }
  setVoiceStatus("Rueckfrage da. Du kannst direkt weiterberichten (Voice oder Text).");
}

function buildVoiceEvaluationConversationText(history) {
  if (!Array.isArray(history) || !history.length) return "";
  return history
    .map((turn, index) => {
      const user = String(turn?.user || "").trim();
      const assistant = String(turn?.assistant || "").trim();
      const parts = [`Turn ${index + 1}`];
      if (user) parts.push(`Arzt: ${user}`);
      if (assistant) parts.push(`Patient: ${assistant}`);
      return parts.join("\n");
    })
    .join("\n\n")
    .trim();
}

async function runVoiceEvaluation(input) {
  const audioBase64 = typeof input?.audioBase64 === "string" ? input.audioBase64 : "";
  const diagnosisText = typeof input?.diagnosisText === "string" ? input.diagnosisText.trim() : "";
  const caseText = getActiveVoiceCaseText();
  const conversationText = buildVoiceEvaluationConversationText(state.voiceHistory);
  const requestBody = {
    caseText,
    history: state.voiceHistory,
    chatModel: normalizeVoiceModel(state.voiceModel),
    preferLocalTts: canUseLocalGermanTts(),
    systemPromptOverride: getPromptForKey("voiceEvaluate")
  };
  if (conversationText) {
    requestBody.conversationText = conversationText;
  }
  if (audioBase64) {
    requestBody.audioBase64 = audioBase64;
  }
  if (diagnosisText) {
    requestBody.diagnosisText = diagnosisText;
  }

  const response = await fetch("/api/voice-evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "API Fehler");
  }

  const diagnosisTranscript =
    typeof payload.diagnosisTranscript === "string" ? payload.diagnosisTranscript.trim() : "";
  const evaluation = payload?.evaluation && typeof payload.evaluation === "object" ? payload.evaluation : null;
  if (!evaluation) {
    throw new Error("Keine Bewertung erhalten.");
  }

  renderVoiceEvaluationReport(evaluation, diagnosisTranscript || diagnosisText);

  const localTtsText =
    typeof evaluation.summary_feedback === "string" && evaluation.summary_feedback.trim()
      ? evaluation.summary_feedback.trim()
      : typeof evaluation.recommendation === "string" && evaluation.recommendation.trim()
        ? evaluation.recommendation.trim()
      : typeof evaluation.teacher_feedback_text === "string"
        ? evaluation.teacher_feedback_text.trim()
        : "";
  const localTtsStarted = speakWithLocalGermanVoice(localTtsText);
  if (localTtsStarted) {
    refs.voiceReplyAudio.pause();
    refs.voiceReplyAudio.removeAttribute("src");
    refs.voiceReplyAudio.classList.add("hidden");
  } else {
    const audioSrc = buildReplyAudioSrc(payload.feedbackAudioBase64);
    if (audioSrc) {
      refs.voiceReplyAudio.src = audioSrc;
      refs.voiceReplyAudio.classList.remove("hidden");
      try {
        await refs.voiceReplyAudio.play();
      } catch {
        // autoplay may be blocked; controls are visible as fallback.
      }
    } else {
      refs.voiceReplyAudio.pause();
      refs.voiceReplyAudio.removeAttribute("src");
      refs.voiceReplyAudio.classList.add("hidden");
    }
  }

  if (localTtsStarted) {
    setVoiceStatus("Bewertung da. Zusammenfassung wird mit lokaler Stimme abgespielt.");
    return;
  }
  setVoiceStatus("Bewertung da. Du kannst den Fall jetzt resetten oder weiterfragen.");
}

function formatScoreForUi(value) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return safe.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatScoreWithMax(value, maxValue) {
  return `${formatScoreForUi(value)} / ${formatScoreForUi(maxValue)}`;
}

function formatVoiceCriteriaText(criteria) {
  if (!Array.isArray(criteria) || !criteria.length) return "";
  return criteria
    .map((item, index) => {
      const name = String(item?.name || `Kriterium ${index + 1}`);
      const score = formatScoreForUi(item?.score);
      const justification = String(item?.justification || "").trim();
      return `${index + 1}. ${name}: ${score} Punkte.${justification ? ` ${justification}` : ""}`;
    })
    .join("\n");
}

function renderVoiceEvaluationReport(report, diagnosisText) {
  if (
    !refs.voiceEvalPanel ||
    !refs.voiceEvalDiagnosis ||
    !refs.voiceEvalOverall ||
    !refs.voiceEvalAnamnesis ||
    !refs.voiceEvalDiagnosisScore ||
    !refs.voiceEvalLikely ||
    !refs.voiceEvalSummary ||
    !refs.voiceEvalQuestionReview ||
    !refs.voiceEvalDiagnosisReview ||
    !refs.voiceEvalTeacherFeedback
  ) {
    return;
  }

  refs.voiceEvalDiagnosis.textContent = diagnosisText
    ? `Bewertungsgrundlage: Gesprächsverlauf plus abgegebene Diagnose („${diagnosisText}“).`
    : "Bewertungsgrundlage: Gesprächsverlauf plus abgegebene Diagnose.";
  refs.voiceEvalOverall.textContent = formatScoreWithMax(
    report.total_score ?? report.overall_score,
    17.5
  );
  refs.voiceEvalAnamnesis.textContent = formatScoreWithMax(report.anamnesis_score, 15);
  refs.voiceEvalDiagnosisScore.textContent = formatScoreWithMax(report.diagnosis_score, 2.5);
  refs.voiceEvalLikely.textContent = String(report.pass_assessment || report.diagnosis_review_text || "");
  refs.voiceEvalSummary.textContent = String(report.summary_feedback || "");
  refs.voiceEvalQuestionReview.textContent =
    formatVoiceCriteriaText(report.criteria) || String(report.question_review_text || "");
  refs.voiceEvalDiagnosisReview.textContent = String(report.pass_assessment || report.diagnosis_review_text || "");
  refs.voiceEvalTeacherFeedback.textContent = String(
    report.recommendation || report.teacher_feedback_text || ""
  );

  refs.voiceEvalPanel.classList.remove("hidden");
}

function clearVoiceEvaluationReport() {
  if (!refs.voiceEvalPanel) return;
  refs.voiceEvalPanel.classList.add("hidden");
  if (refs.voiceEvalDiagnosis) refs.voiceEvalDiagnosis.textContent = "";
  if (refs.voiceEvalOverall) refs.voiceEvalOverall.textContent = formatScoreWithMax(0, 17.5);
  if (refs.voiceEvalAnamnesis) refs.voiceEvalAnamnesis.textContent = formatScoreWithMax(0, 15);
  if (refs.voiceEvalDiagnosisScore) refs.voiceEvalDiagnosisScore.textContent = formatScoreWithMax(0, 2.5);
  if (refs.voiceEvalLikely) refs.voiceEvalLikely.textContent = "";
  if (refs.voiceEvalSummary) refs.voiceEvalSummary.textContent = "";
  if (refs.voiceEvalQuestionReview) refs.voiceEvalQuestionReview.textContent = "";
  if (refs.voiceEvalDiagnosisReview) refs.voiceEvalDiagnosisReview.textContent = "";
  if (refs.voiceEvalTeacherFeedback) refs.voiceEvalTeacherFeedback.textContent = "";
}

function resetVoiceConversation(options = {}) {
  const keepCaseText = Boolean(options.keepCaseText);
  const preserveStatus = Boolean(options.preserveStatus);

  if (state.voiceRealtimeActive || state.voiceRealtimeConnecting) {
    stopVoiceRealtimeSession({ preserveStatus: true, silent: true });
  }

  state.voiceHistory = [];
  state.voiceDoctorConversationHistory = [];
  setVoiceBusy(false);

  if (state.voiceRecording) {
    stopVoiceRecording(false, "reset");
  } else {
    cleanupVoiceMedia();
  }
  state.voiceRecording = false;
  updateVoiceRecordButton();

  refs.voiceLastTurn.classList.add("hidden");
  refs.voiceUserTranscript.textContent = "";
  refs.voiceAssistantReply.textContent = "";
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");
  refs.voiceReplyAudio.pause();
  refs.voiceReplyAudio.removeAttribute("src");
  refs.voiceReplyAudio.classList.add("hidden");
  clearVoiceEvaluationReport();
  clearVoiceDoctorConversationEvaluationReport();

  if (!keepCaseText) {
    refs.voiceCaseInput.value = "";
    saveToStorage(STORAGE_VOICE_CASE_KEY, { caseText: "" });
  }

  if (!preserveStatus) {
    setVoiceStatus(buildVoiceReadyStatus());
  }
}

function setPromptProposalBusy(isBusy) {
  state.promptProposalBusy = Boolean(isBusy);
  const promptUiBusy = state.voiceBusy || state.promptProposalBusy;
  applyPromptEditorBusyState(promptUiBusy);
}

function applyPromptEditorBusyState(isBusy) {
  if (refs.voicePromptConfigToggleBtn) {
    refs.voicePromptConfigToggleBtn.disabled = isBusy;
  }
  if (refs.voicePromptConfigSaveBtn) {
    refs.voicePromptConfigSaveBtn.disabled = isBusy;
  }
  if (refs.voicePromptConfigResetBtn) {
    refs.voicePromptConfigResetBtn.disabled = isBusy;
  }
  if (refs.voicePromptProposalSubmitBtn) {
    refs.voicePromptProposalSubmitBtn.disabled = isBusy;
  }
  if (refs.voicePromptProposalNameInput) {
    refs.voicePromptProposalNameInput.disabled = isBusy;
  }
  if (refs.voicePromptProposalNoteInput) {
    refs.voicePromptProposalNoteInput.disabled = isBusy;
  }
  if (refs.voicePromptProposalTargetSelect) {
    refs.voicePromptProposalTargetSelect.disabled = isBusy;
  }
  if (refs.voicePromptProposalApplyNowInput) {
    refs.voicePromptProposalApplyNowInput.disabled = isBusy;
  }
  for (const promptKey of PROMPT_FIELD_KEYS) {
    const refKey = PROMPT_EDITOR_REF_KEY_BY_PROMPT_KEY[promptKey];
    const input = refs[refKey];
    if (input) {
      input.disabled = isBusy;
    }
    const presetSelectRefKey = PROMPT_PRESET_SELECT_REF_KEY_BY_PROMPT_KEY[promptKey];
    const presetSelect = refs[presetSelectRefKey];
    if (presetSelect) {
      presetSelect.disabled = isBusy;
    }
  }
}

function setVoiceBusy(isBusy) {
  state.voiceBusy = Boolean(isBusy);
  const realtimeLocked = state.voiceRealtimeActive || state.voiceRealtimeConnecting;
  if (refs.voiceCaseSelect) {
    refs.voiceCaseSelect.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceModelSelect) {
    refs.voiceModelSelect.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceNextCaseBtn) {
    refs.voiceNextCaseBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDiagnoseBtn) {
    refs.voiceDiagnoseBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDoctorConversationBtn) {
    refs.voiceDoctorConversationBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDoctorConversationEvalBtn) {
    refs.voiceDoctorConversationEvalBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voicePatientConversationBtn) {
    refs.voicePatientConversationBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceTextSendBtn) {
    refs.voiceTextSendBtn.disabled = state.voiceBusy;
  }
  if (refs.voiceTextInput) {
    refs.voiceTextInput.disabled = state.voiceBusy;
  }
  if (refs.voiceCaseInput) {
    const customModeActive = getActiveVoiceCaseSelection() === VOICE_CASE_CUSTOM;
    refs.voiceCaseInput.disabled = !customModeActive || state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceRealtimeToggleBtn) {
    refs.voiceRealtimeToggleBtn.disabled = state.voiceBusy || state.voiceRecording;
  }
  if (refs.voiceRealtimeMuteBtn) {
    refs.voiceRealtimeMuteBtn.disabled = state.voiceBusy || !state.voiceRealtimeActive;
  }
  if (refs.voiceApiSpendResetBtn) {
    refs.voiceApiSpendResetBtn.disabled = state.voiceBusy;
  }
  if (refs.voiceCreateCaseBtn) {
    refs.voiceCreateCaseBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceCaseInfoToggleBtn) {
    refs.voiceCaseInfoToggleBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDoctorLetterToggleBtn) {
    refs.voiceDoctorLetterToggleBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDoctorLetterSubmitBtn) {
    refs.voiceDoctorLetterSubmitBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceDoctorLetterInput) {
    refs.voiceDoctorLetterInput.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceSamplePatientBtn) {
    refs.voiceSamplePatientBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceSampleLetterBtn) {
    refs.voiceSampleLetterBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.voiceSampleDoctorBtn) {
    refs.voiceSampleDoctorBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  if (refs.openLearningBtn) {
    refs.openLearningBtn.disabled = state.voiceBusy || realtimeLocked;
  }
  applyPromptEditorBusyState(state.voiceBusy || state.promptProposalBusy);
  refs.voiceRecordBtn.disabled = state.voiceBusy || state.voiceRealtimeConnecting || !isVoiceCaptureSupported();
  updateVoiceRealtimeUi();
}

function setVoiceStatus(message, isError = false) {
  refs.voiceStatus.textContent = message;
  refs.voiceStatus.classList.toggle("error", Boolean(isError));
}

function updateVoiceRecordButton() {
  if (state.voiceRealtimeActive) {
    refs.voiceRecordBtn.textContent = state.voiceRecording ? "⏹ Realtime stoppen" : "🎤 Realtime sprechen";
  } else if (isDiagnosisMode()) {
    refs.voiceRecordBtn.textContent = state.voiceRecording
      ? "⏹ Diagnose stoppen"
      : "🎤 Diagnose sprechen";
  } else if (isDoctorConversationMode()) {
    refs.voiceRecordBtn.textContent = state.voiceRecording
      ? "⏹ Bericht stoppen"
      : "🎤 Bericht sprechen";
  } else {
    refs.voiceRecordBtn.textContent = state.voiceRecording
      ? "⏹ Aufnahme stoppen"
      : "🎤 Aufnahme starten";
  }
  refs.voiceRecordBtn.classList.toggle("recording", state.voiceRecording);
}

function cleanupVoiceMedia() {
  if (voiceAutoStopTimer) {
    window.clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = null;
  }
  if (activeMediaStream) {
    for (const track of activeMediaStream.getTracks()) {
      track.stop();
    }
    activeMediaStream = null;
  }
  activeMediaRecorder = null;
}

function pickRecordingMimeType() {
  if (!window.MediaRecorder || typeof window.MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  const supported = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  return supported.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
}

function isVoiceCaptureSupported() {
  return Boolean(
    window.MediaRecorder &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Audio konnte nicht gelesen werden."));
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");
      if (commaIndex < 0) {
        reject(new Error("Ungueltiges Audio-Format."));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function stripDataUrlAudio(value) {
  if (!String(value || "").startsWith("data:")) {
    return value;
  }
  const commaIndex = String(value).indexOf(",");
  if (commaIndex < 0) {
    return value;
  }
  return String(value).slice(commaIndex + 1);
}

async function enqueueRealtimeAssistantAudio(base64Delta) {
  const clean = String(base64Delta || "").replace(/\s+/g, "").trim();
  if (!clean) return;
  const bytes = decodeBase64ToBytes(clean);
  if (!bytes || bytes.length < 2) return;
  const sampleCount = Math.floor(bytes.length / 2);
  if (sampleCount <= 0) return;
  const context = await ensureRealtimeAudioContext();
  if (!context) return;

  const audioBuffer = context.createBuffer(1, sampleCount, REALTIME_OUTPUT_SAMPLE_RATE);
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    const lo = bytes[i * 2];
    const hi = bytes[i * 2 + 1];
    let sample = (hi << 8) | lo;
    if (sample >= 0x8000) {
      sample -= 0x10000;
    }
    channel[i] = sample / 0x8000;
  }

  const now = context.currentTime + 0.02;
  if (!Number.isFinite(realtimeAudioNextPlayTime) || realtimeAudioNextPlayTime < now - 0.4) {
    realtimeAudioNextPlayTime = now;
  }
  const startAt = Math.max(now, realtimeAudioNextPlayTime);
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(context.destination);
  source.start(startAt);
  realtimeAudioNextPlayTime = startAt + audioBuffer.duration;
}

async function ensureRealtimeAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!realtimeAudioContext || realtimeAudioContext.state === "closed") {
    realtimeAudioContext = new AudioContextCtor({ sampleRate: REALTIME_OUTPUT_SAMPLE_RATE });
    realtimeAudioNextPlayTime = 0;
  }
  if (realtimeAudioContext.state === "suspended") {
    try {
      await realtimeAudioContext.resume();
    } catch {
      // ignore and keep trying playback
    }
  }
  return realtimeAudioContext;
}

function decodeBase64ToBytes(value) {
  try {
    const binary = atob(String(value || ""));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function resetRealtimeAudioPlayback() {
  realtimeAudioNextPlayTime = 0;
  const context = realtimeAudioContext;
  realtimeAudioContext = null;
  if (!context) return;
  try {
    if (context.state !== "closed") {
      void context.close();
    }
  } catch {
    // ignore
  }
}

function buildReplyAudioSrc(audioBase64) {
  if (typeof audioBase64 !== "string" || !audioBase64.trim()) return "";
  if (audioBase64.startsWith("data:audio")) {
    return audioBase64;
  }
  return `data:audio/wav;base64,${audioBase64}`;
}

function canUseLocalGermanTts() {
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
    return false;
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.some((voice) => String(voice.lang || "").toLowerCase().startsWith("de"));
}

function speakWithLocalGermanVoice(text) {
  if (!text || !canUseLocalGermanTts()) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickBestGermanVoice(window.speechSynthesis.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "de-DE";
    } else {
      utterance.lang = "de-DE";
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.warn("Lokale Sprachausgabe fehlgeschlagen", error);
    return false;
  }
}

function pickBestGermanVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const german = voices.filter((voice) =>
    String(voice.lang || "").toLowerCase().startsWith("de")
  );
  if (!german.length) return null;

  const exactDe = german.find((voice) => String(voice.lang || "").toLowerCase() === "de-de");
  if (exactDe) return exactDe;

  const likelyNative = german.find((voice) => {
    const name = String(voice.name || "").toLowerCase();
    return name.includes("deutsch") || name.includes("german");
  });
  if (likelyNative) return likelyNative;

  return german[0];
}

function getActiveVoiceCaseText() {
  const selection = getActiveVoiceCaseSelection();

  if (selection === VOICE_CASE_CUSTOM) {
    const userCaseText = refs.voiceCaseInput.value.trim().slice(0, MAX_VOICE_CASE_LENGTH);
    if (userCaseText) {
      return userCaseText;
    }
    return DEFAULT_VOICE_CASE;
  }

  if (selection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    const selectedId = selection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
    const entry = state.voiceCaseLibrary.find((item) => item.id === selectedId);
    if (entry?.text) {
      return entry.text;
    }
  }

  return DEFAULT_VOICE_CASE;
}

async function ensureVoiceCaseLibraryLoaded() {
  if (state.voiceCaseLibraryLoaded) {
    return true;
  }

  try {
    const url = new URL(`../${VOICE_CASE_LIBRARY_PATH}?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("voice-case-library-fetch-failed");
    }

    const raw = await response.text();
    state.voiceCaseLibrary = parseVoiceCaseLibrary(raw);
    state.voiceCaseLibraryLoaded = true;
    renderVoiceCaseSelect();
    applyVoiceCaseSelection(state.voiceCaseSelection, {
      preserveStatus: true,
      resetConversation: false
    });
    return true;
  } catch (error) {
    console.warn("Fallbibliothek konnte nicht geladen werden", error);
    state.voiceCaseLibrary = [];
    state.voiceCaseLibraryLoaded = false;
    renderVoiceCaseSelect();
    applyVoiceCaseSelection(state.voiceCaseSelection, {
      preserveStatus: true,
      resetConversation: false
    });
    return false;
  }
}

function parseVoiceCaseLibrary(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return [];
  }
  return rawText
    .split(/\r?\n---+\r?\n/g)
    .map((block) => block.trim())
    .filter((block) => block.startsWith("CASE_ID:"))
    .map((block, index) => {
      const caseId = extractCaseId(block) || `case_${index + 1}`;
      return {
        id: caseId,
        label: buildVoiceCaseLabel(caseId, block, index),
        text: block
      };
    });
}

function extractCaseId(blockText) {
  if (typeof blockText !== "string") return "";
  const match = blockText.match(/^CASE_ID:\s*(.+)$/m);
  return match ? match[1].trim() : "";
}

function buildVoiceCaseLabel(caseId, blockText, index) {
  return String(index + 1);
}

async function initSupabaseSession() {
  if (!supabase) return;
  const {
    data: { session }
  } = await supabase.auth.getSession();
  await applySession(session);

  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    await applySession(newSession);
  });
}

async function applySession(session) {
  const user = session?.user || null;
  state.user = user;
  state.promptProfilesLoaded = false;
  if (!user) {
    state.sessionXp = 0;
    state.promptProposalBusy = false;
    state.promptPresetOptionsByKey = createEmptyPromptPresetOptions();
    renderPromptPresetSelects();
    renderSessionXpDisplay();
    resetVoiceConversation({ keepCaseText: true, preserveStatus: false });
    remoteStateRowId = null;
    exitImmersiveMode();
    closeStatsOverlay();
  }
  updateAuthUi();
  if (!user) return;
  await loadGlobalPromptProfiles();
  await loadPromptPresetOptions({ silent: true });
  await pullRemoteState();
}

async function loadGlobalPromptProfiles() {
  if (!supabase || !state.user) return;
  if (state.promptProfilesLoaded) return;

  const { data, error } = await runSupabaseWithTimeout(
    supabase
      .from(SUPABASE_PROMPT_PROFILES_TABLE)
      .select("prompt_key, prompt_text, is_active")
      .eq("is_active", true),
    "Globale Prompt-Profile laden"
  );
  if (error) {
    console.warn("Globale Prompt-Profile konnten nicht geladen werden", error);
    return;
  }

  const nextConfig = { ...state.promptConfig };
  let changed = false;
  for (const row of Array.isArray(data) ? data : []) {
    const promptKey = String(row?.prompt_key || "");
    if (!PROMPT_FIELD_KEYS.includes(promptKey)) continue;
    if (!row?.is_active) continue;
    const promptText = normalizePromptText(row?.prompt_text, DEFAULT_PROMPT_CONFIG[promptKey]);
    if (!promptText) continue;
    if (nextConfig[promptKey] !== promptText) {
      nextConfig[promptKey] = promptText;
      changed = true;
    }
  }

  if (changed) {
    state.promptConfig = resolvePromptConfig(nextConfig);
    saveToStorage(STORAGE_PROMPT_CONFIG_KEY, state.promptConfig);
    renderPromptConfigEditor();
  }
  state.promptProfilesLoaded = true;
}

function updateAuthUi() {
  if (!supabaseReady) {
    document.body.classList.add("auth-only");
    refs.authPage.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.toggleStatsBtn.classList.add("hidden");
    return;
  }

  if (!state.user) {
    document.body.classList.add("auth-only");
    refs.authStatus.textContent = "Nicht eingeloggt";
    refs.authPage.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.toggleStatsBtn.classList.add("hidden");
    closeStatsOverlay();
    return;
  }

  document.body.classList.remove("auth-only");
  refs.authStatus.textContent = `Eingeloggt als ${state.user.email}`;
  refs.sessionText.textContent = `Eingeloggt als ${state.user.email}`;
  refs.authPage.classList.add("hidden");
  refs.appContent.classList.remove("hidden");
  refs.toggleStatsBtn.classList.remove("hidden");
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!supabase) return;
  const email = refs.emailInput.value.trim();
  const password = refs.passwordInput.value;
  if (!email || !password) return;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      refs.authStatus.textContent = `Login fehlgeschlagen: ${error.message}`;
      return;
    }

    refs.emailInput.value = "";
    refs.passwordInput.value = "";
  } catch (networkError) {
    refs.authStatus.textContent =
      "Login fehlgeschlagen: Netzwerkproblem. Bitte Supabase-URL/Key und Internet pruefen.";
    console.error(networkError);
  }
}

async function handleSignup() {
  if (!supabase) return;
  const email = refs.emailInput.value.trim();
  const password = refs.passwordInput.value;
  if (!email || !password) {
    refs.authStatus.textContent = "Bitte E-Mail und Passwort eingeben.";
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      refs.authStatus.textContent = `Registrierung fehlgeschlagen: ${error.message}`;
      return;
    }

    refs.authStatus.textContent = "Registrierung erfolgreich. Du bist nun eingeloggt.";
    refs.emailInput.value = "";
    refs.passwordInput.value = "";
  } catch (networkError) {
    refs.authStatus.textContent =
      "Registrierung fehlgeschlagen: Netzwerkproblem. Bitte Supabase-URL/Key und Internet pruefen.";
    console.error(networkError);
  }
}

async function handleLogout() {
  if (!supabase) return;
  await supabase.auth.signOut();
  exitImmersiveMode();
  closeStatsOverlay();
  refs.authStatus.textContent = "Ausgeloggt";
}

function handleDailyGoalEdit() {
  const current = normalizeDailyGoal(state.dailyGoal);
  const rawInput = window.prompt("Tagesziel in XP festlegen (1-500):", String(current));
  if (rawInput === null) return;

  const parsed = Number.parseInt(rawInput.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return;
  }
  setDailyGoal(parsed);
}

function setDailyGoal(nextGoal) {
  const normalized = normalizeDailyGoal(nextGoal);
  if (normalized === state.dailyGoal) return;
  state.dailyGoal = normalized;
  saveToStorage(STORAGE_DAILY_GOAL_KEY, { goal: normalized });
  scheduleRemoteSync();
  renderStats();
}

function startQuickPractice() {
  state.sessionXp = 0;
  renderSessionXpDisplay();
  state.selectedFolder = "regular";
  renderFolderFilters();
  enterImmersiveMode();
}

function handleOpenLearningPanel() {
  state.learningRootId = "anamnese";
  state.learningView = LEARNING_VIEW_ROOT;
  renderLearningFlow();
  refs.learningPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleLearningBackClick() {
  if (state.learningView === LEARNING_VIEW_READING) {
    state.learningView = LEARNING_VIEW_SUBCATEGORIES;
    renderLearningFlow();
  }
}

function handleLearningBodyBackClick() {
  if (state.learningView !== LEARNING_VIEW_BODY) return;
  if (state.learningBodyDetailOpen) {
    state.learningBodyDetailOpen = false;
    renderLearningFlow();
    return;
  }
  state.learningView = LEARNING_VIEW_ROOT;
  renderLearningFlow();
}

function handleLearningBodyRegionBackClick() {
  if (state.learningView !== LEARNING_VIEW_BODY) return;
  state.learningBodyDetailOpen = false;
  renderLearningFlow();
}

async function loadLearningAnamneseContent() {
  if (!refs.learningPanel) {
    return;
  }

  renderLearningLoading("Lerninhalte werden geladen ...");
  try {
    const url = new URL(`../${LEARNING_ANAMNESE_PATH}?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("learning-fetch-failed");
    }
    const payload = await response.json();
    const normalized = normalizeLearningAnamnesePayload(payload);
    state.learningAnamnese = normalized;
    const firstCategoryId = normalized.categories[0]?.id || "";
    const hasActiveCategory = normalized.categories.some(
      (entry) => entry.id === state.learningActiveCategoryId
    );
    state.learningActiveCategoryId = hasActiveCategory ? state.learningActiveCategoryId : firstCategoryId;
    renderLearningFlow();
  } catch (error) {
    console.error("Lernbereich konnte nicht geladen werden", error);
    state.learningAnamnese = null;
    state.learningActiveCategoryId = "";
    renderLearningLoading("Lerninhalte konnten nicht geladen werden.");
  }
}

function normalizeLearningAnamnesePayload(rawValue) {
  const source = rawValue && typeof rawValue === "object" ? rawValue : {};
  const categoriesRaw = Array.isArray(source.categories) ? source.categories : [];
  const categories = categoriesRaw
    .map((item) => normalizeLearningCategory(item))
    .filter((item) => Boolean(item));
  return {
    title: safeLine(source.title || "Lernbereich", 120),
    subtitle: safeLine(source.subtitle || "Anamnese", 180),
    scopeNote: safeParagraph(source.scope_note || "", 500),
    categories,
    references: normalizeLearningReferenceList(source.references)
  };
}

function normalizeLearningReferenceList(rawValue) {
  if (!Array.isArray(rawValue)) return [];
  const out = [];
  for (const entry of rawValue) {
    if (!entry || typeof entry !== "object") continue;
    const label = safeLine(entry.label || "", 180);
    const url = safeLine(entry.url || "", 500);
    if (!label) continue;
    out.push({ label, url });
  }
  return out;
}

function normalizeLearningCategory(rawValue) {
  if (!rawValue || typeof rawValue !== "object") return null;
  const id = safeLine(rawValue.id || "", 80);
  const title = safeLine(rawValue.title || "", 160);
  if (!id || !title) return null;

  const learningText = Array.isArray(rawValue.learning_text)
    ? rawValue.learning_text
        .map((item) => safeParagraph(item, 3000))
        .filter((item) => Boolean(item))
    : [];
  const questionGroups = Array.isArray(rawValue.question_groups)
    ? rawValue.question_groups
        .map((group) => normalizeLearningQuestionGroup(group))
        .filter((group) => Boolean(group))
    : [];
  const questionCount = questionGroups.reduce((sum, group) => sum + group.questions.length, 0);
  const sourceTags = Array.isArray(rawValue.source_tags)
    ? rawValue.source_tags.map((item) => safeLine(item, 220)).filter((item) => Boolean(item))
    : [];

  return {
    id,
    title,
    focus: safeLine(rawValue.focus || "", 240),
    summary: safeParagraph(rawValue.summary || "", 600),
    learningText,
    questionGroups,
    questionCount,
    sourceTags
  };
}

function normalizeLearningQuestionGroup(rawValue) {
  if (!rawValue || typeof rawValue !== "object") return null;
  const title = safeLine(rawValue.title || "", 180);
  if (!title) return null;
  const questions = Array.isArray(rawValue.questions)
    ? rawValue.questions.map((item) => safeParagraph(item, 320)).filter((item) => Boolean(item))
    : [];
  return { title, questions };
}

function renderLearningLoading(message) {
  if (refs.learningRootView) refs.learningRootView.classList.remove("hidden");
  if (refs.learningSubcategoryView) refs.learningSubcategoryView.classList.add("hidden");
  if (refs.learningBodyView) refs.learningBodyView.classList.add("hidden");
  if (refs.learningReadingView) refs.learningReadingView.classList.add("hidden");
  if (refs.learningRootList) refs.learningRootList.innerHTML = "";
  if (refs.learningSubcategoryList) refs.learningSubcategoryList.innerHTML = "";
  if (refs.learningBodyCanvas) refs.learningBodyCanvas.innerHTML = "";
  if (refs.learningBodyRegionGallery) refs.learningBodyRegionGallery.innerHTML = "";
  if (refs.learningBodyRegionDeepDive) refs.learningBodyRegionDeepDive.innerHTML = "";
  if (refs.learningBodyRegionBullets) refs.learningBodyRegionBullets.innerHTML = "";
  if (refs.learningBodyRegionTitle) refs.learningBodyRegionTitle.textContent = "Bereich";
  if (refs.learningBodyRegionHint) refs.learningBodyRegionHint.textContent = "";
  if (refs.learningBodySelectionView) refs.learningBodySelectionView.classList.remove("hidden");
  if (refs.learningBodyRegionDetailView) refs.learningBodyRegionDetailView.classList.add("hidden");
  if (refs.learningBodyStatus) refs.learningBodyStatus.textContent = "";
  state.learningBodyDetailOpen = false;
  if (refs.learningReadingTitle) refs.learningReadingTitle.textContent = "Lernbereich";
  if (refs.learningReadingMeta) refs.learningReadingMeta.textContent = "";
  if (refs.learningReadingText) refs.learningReadingText.innerHTML = "";
  if (refs.learningReadingQuestionGroups) refs.learningReadingQuestionGroups.innerHTML = "";
  if (refs.learningReadingSources) refs.learningReadingSources.innerHTML = "";
  if (refs.learningReadingStatus) refs.learningReadingStatus.textContent = safeLine(message, 220);
}

function renderLearningFlow() {
  const bundle = state.learningAnamnese;
  const hasAnamnese = Boolean(bundle && Array.isArray(bundle.categories) && bundle.categories.length > 0);

  renderLearningRootList();
  if (state.learningView === LEARNING_VIEW_ROOT) {
    showLearningView(LEARNING_VIEW_ROOT);
    return;
  }

  if (!hasAnamnese) {
    renderLearningLoading("Noch keine Lerninhalte vorhanden.");
    return;
  }

  if (state.learningView === LEARNING_VIEW_SUBCATEGORIES) {
    renderLearningSubcategoryList(bundle.categories);
    showLearningView(LEARNING_VIEW_SUBCATEGORIES);
    return;
  }

  renderLearningReadingMode(bundle.categories);
  showLearningView(LEARNING_VIEW_READING);
}

function showLearningView(viewId) {
  if (refs.learningRootView) refs.learningRootView.classList.toggle("hidden", viewId !== LEARNING_VIEW_ROOT);
  if (refs.learningSubcategoryView) {
    refs.learningSubcategoryView.classList.toggle("hidden", viewId !== LEARNING_VIEW_SUBCATEGORIES);
  }
  if (refs.learningBodyView) refs.learningBodyView.classList.toggle("hidden", viewId !== LEARNING_VIEW_BODY);
  if (refs.learningReadingView) refs.learningReadingView.classList.toggle("hidden", viewId !== LEARNING_VIEW_READING);
  document.body.classList.toggle("learning-reader", viewId === LEARNING_VIEW_READING);
  if (refs.learningPanel) {
    refs.learningPanel.classList.toggle("is-reader-view", viewId === LEARNING_VIEW_READING);
  }
}

function renderLearningRootList() {
  if (!refs.learningRootList) return;
  refs.learningRootList.innerHTML = "";
  for (const rootEntry of LEARNING_ROOT_ITEMS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "learning-root-btn";
    const title = document.createElement("span");
    title.className = "learning-root-title";
    title.textContent = rootEntry.label;
    const count = document.createElement("span");
    count.className = "learning-root-count";
    count.textContent = rootEntry.cta || "Themen oeffnen";
    button.appendChild(title);
    button.appendChild(count);
    button.addEventListener("click", () => {
      state.learningRootId = rootEntry.id;
      state.learningView = rootEntry.view || LEARNING_VIEW_SUBCATEGORIES;
      renderLearningFlow();
    });
    refs.learningRootList.appendChild(button);
  }
}

function renderLearningSubcategoryList(categories) {
  if (refs.learningSubcategoryTitle) {
    const selectedRoot = LEARNING_ROOT_ITEMS.find((entry) => entry.id === state.learningRootId);
    refs.learningSubcategoryTitle.textContent = selectedRoot?.label || "Unterkategorien";
  }
  if (!refs.learningSubcategoryList) return;
  refs.learningSubcategoryList.innerHTML = "";
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "learning-subcategory-btn";
    const title = document.createElement("span");
    title.className = "learning-subcategory-title";
    title.textContent = category.title;
    const count = document.createElement("span");
    count.className = "learning-subcategory-count";
    count.textContent = `${category.questionCount} Fragen`;
    button.appendChild(title);
    button.appendChild(count);
    button.addEventListener("click", () => {
      state.learningActiveCategoryId = category.id;
      state.learningView = LEARNING_VIEW_READING;
      renderLearningFlow();
    });
    refs.learningSubcategoryList.appendChild(button);
  }
}

function getLearningBodyRegionById(regionId) {
  const key = String(regionId || "");
  return (
    BODY_ATLAS_REGION_BY_ID[key] ||
    BODY_ATLAS_REGION_BY_ID[BODY_ATLAS_DEFAULT_REGION_ID] ||
    BODY_ATLAS_REGIONS[0] ||
    null
  );
}

function getLearningBodyRegionDetailedTerms(region) {
  const base = Array.isArray(region?.hotspots) ? region.hotspots : [];
  const group = getLearningBodyRegionGroup(region?.id || "");
  const extras = BODY_ATLAS_EXTRA_TERMS_BY_GROUP[group] || [];
  const merged = [];
  const seen = new Set();

  const addTerm = (term) => {
    if (!term || typeof term !== "object") return;
    const fach = safeLine(term.fach || "", 160);
    if (!fach) return;
    const key = fach.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      fach,
      patient: safeLine(term.patient || "", 180),
      info: safeParagraph(term.info || "", 220)
    });
  };

  base.forEach(addTerm);
  extras.forEach(addTerm);

  return merged.map((entry) => ({
    fach: entry.fach,
    patient: entry.patient || "-",
    info: entry.info || ""
  }));
}

function getLearningBodyRegionGroup(regionId) {
  switch (regionId) {
    case "kopf_gehirn":
      return "head";
    case "gesicht_hno":
    case "hals":
      return "hno";
    case "thorax":
      return "thorax";
    case "herz_lunge":
      return "cardio";
    case "oberbauch":
      return "upper_abdomen";
    case "unterbauch_darm":
      return "lower_abdomen";
    case "becken_uro":
      return "pelvis";
    case "ruecken_wirbelsaeule":
      return "spine";
    case "linker_oberarm":
    case "rechter_oberarm":
      return "upper_arm";
    case "linker_unterarm_hand":
    case "rechter_unterarm_hand":
      return "forearm_hand";
    case "linkes_bein":
    case "rechtes_bein":
      return "leg";
    default:
      return "general";
  }
}

function getLearningBodyDeepDive(region) {
  const group = getLearningBodyRegionGroup(region.id);
  switch (group) {
    case "head":
      return {
        anamnese: [
          "Seit wann bestehen die Beschwerden und wie war der Beginn (ploetzlich/schleichend)?",
          "Gab es neurologische Ausfaelle wie Sprachstoerung, Sehstoerung, Laehmungsgefuehl oder Taubheit?",
          "Wie intensiv ist der Schmerz (NRS 0-10) und gibt es Trigger wie Belastung, Licht oder Stress?",
          "Bestehen Begleitsymptome wie Uebelkeit, Erbrechen, Fieber oder Nackensteife?",
          "Gab es kuerzlich Kopftrauma, Infekt oder Medikamentenumstellung?",
          "Welche Vorerkrankungen (Hypertonie, Migraene, Schlaganfall) sind bekannt?"
        ],
        untersuchung: [
          "Bewusstseinslage, Orientierung, Sprache und Reaktionsverhalten.",
          "Pupillenreaktion, Blickbewegungen, grobe Hirnnervenpruefung.",
          "Motorik und Sensibilitaet beidseits vergleichen.",
          "Meningismuszeichen und Koordinationspruefung.",
          "Vitalparameter mit Fokus auf RR, Temperatur, Sauerstoffsaettigung."
        ],
        redFlags: [
          "Thunderclap-Kopfschmerz (maximal innerhalb einer Minute).",
          "Neu aufgetretene fokal-neurologische Defizite.",
          "Bewusstseinsstoerung, Krampfanfall oder progrediente Verschlechterung.",
          "Kopfschmerz mit Fieber/Nackensteife oder nach Trauma/Antikoagulation."
        ],
        naechsteSchritte: [
          "Sofortige Priorisierung potenziell vital bedrohlicher Ursachen.",
          "Fruehe Bildgebung bei Warnzeichen (cCT/MRT je nach Situation).",
          "Neurologisches Monitoring und engmaschige Re-Evaluation.",
          "Patientengerechte Aufklaerung ueber Warnzeichen und Notfallkriterien."
        ]
      };
    case "hno":
      return {
        anamnese: [
          "Welche Hauptbeschwerden stehen im Vordergrund (Schlucken, Stimme, Atmung, Schmerz)?",
          "Bestehen Fieber, eitriges Sekret, Husten oder belastungsabhaengige Dyspnoe?",
          "Gab es kuerzlich Infektkontakte, Rauchexposition oder berufliche Reizstoffe?",
          "Sind Schluckstoerungen, Gewichtsverlust oder anhaltende Heiserkeit vorhanden?",
          "Treten Beschwerden ein- oder beidseitig auf und strahlen sie aus?",
          "Welche bisherigen Therapieversuche (Sprays, Antibiotika, Analgetika) gab es?"
        ],
        untersuchung: [
          "Inspektion von Mundhoehle, Rachen und Halsweichteilen.",
          "Palpation zervikaler Lymphknoten und Schilddruesenregion.",
          "Atemwegsbeurteilung inkl. Stridor/Heiserkeit.",
          "Nasale Durchgaengigkeit und Nebenhoehlen-Druckpunkte.",
          "Fieber, Puls, RR und Entzuendungszeichen dokumentieren."
        ],
        redFlags: [
          "Atemnot, inspiratorischer Stridor oder rasch zunehmende Schluckstoerung.",
          "Peritonsillaerer Prozess mit Kieferklemme oder kloessiger Sprache.",
          "Persistierende Heiserkeit >3 Wochen ohne klare Ursache.",
          "Schmerzhafte Halsweichteilschwellung mit systemischer Verschlechterung."
        ],
        naechsteSchritte: [
          "Atemwegssicherheit zuerst, danach differenzierte HNO-Abklaerung.",
          "Entzuendungsdiagnostik und ggf. Sonografie/Endoskopie einplanen.",
          "Therapieplan mit Analgesie, ggf. antientzuendlicher oder antiinfektiver Strategie.",
          "Klare Rueckkehrkriterien bei Warnzeichen kommunizieren."
        ]
      };
    case "thorax":
      return {
        anamnese: [
          "Lokalisation und Charakter: Druck, Stechen, Brennen oder atemabhaengig?",
          "Belastungsbezug, Ausstrahlung und Dauer einzelner Episoden.",
          "Begleitsymptome wie Dyspnoe, Husten, Fieber, Palpitationen, Schweiss.",
          "Risikoprofil: Rauchen, Immobilisation, kardiale Vorerkrankungen.",
          "Trauma, kuerzliche Infekte oder neue Medikamente erfragen.",
          "Vorherige Thoraxdiagnostik und bekannte Befunde dokumentieren."
        ],
        untersuchung: [
          "Auskultation von Herz und Lunge, Atemarbeit beurteilen.",
          "Thoraxinspektion, Druckschmerz und asymmetrische Atemexkursion pruefen.",
          "Sauerstoffsaettigung in Ruhe/Belastung und Vitalparameter.",
          "Periphere Oedeme, Halsvenenstauung, Zeichen der Kreislaufbelastung.",
          "Kurze Funktionsbeurteilung (Treppensteigen/Gehtest falls stabil)."
        ],
        redFlags: [
          "Akute Luftnot, Zyanose oder Haemodynamikinstabilitaet.",
          "Thoraxschmerz mit Synkope, Schockzeichen oder Rhythmusstoerung.",
          "Einseitig abgeschwaechtes Atemgeraesch mit ploetzlichem Schmerzbeginn.",
          "Thoraxschmerz + Fieber + deutliche Allgemeinzustandsverschlechterung."
        ],
        naechsteSchritte: [
          "Sofortpriorisierung vital bedrohlicher Ursachen (ACS, LE, Pneumothorax).",
          "Basisdiagnostik: EKG, Labor, Bildgebung je nach Klinik.",
          "Fruehe Verlaufskontrolle unter initialer Therapie.",
          "Patientensprache fuer Verdachtsdiagnosen und Plan nutzen."
        ]
      };
    case "cardio":
      return {
        anamnese: [
          "Thoraxschmerz: Charakter, Ausstrahlung, Belastungsbezug, Dauer.",
          "Dyspnoe, Orthopnoe, Belastungsabfall, Palpitationen, Synkopen erfragen.",
          "Kardiovaskulaere Risiken (Hypertonie, Diabetes, Lipide, Rauchen).",
          "Medikamentenanamnese inkl. Antikoagulation/Herzmedikamente.",
          "Vorbefunde: Herzkatheter, Echo, Rhythmusdiagnosen, Klappenfehler.",
          "Familiaere Vorbelastung fuer kardiovaskulaere Ereignisse."
        ],
        untersuchung: [
          "Herzauskultation (Rhythmus, Nebengeraeusche), periphere Pulse.",
          "Lungenauskultation auf Stauungszeichen.",
          "Perfusion, Hautkolorit, Rekapillarisierung, Oedeme.",
          "Vitalparameter trendbasiert erfassen.",
          "Belastbarkeit und kardio-pulmonale Reserve einschaetzen."
        ],
        redFlags: [
          "Anhaltender Druckschmerz mit vegetativer Symptomatik.",
          "Neu aufgetretene schwere Dyspnoe oder Synkope.",
          "Tachy-/Bradyarrhythmie mit Kreislaufinstabilitaet.",
          "Zeichen der akuten Herzinsuffizienz mit Hypoxie."
        ],
        naechsteSchritte: [
          "Dringliche EKG-/Labor-/Monitoring-Strategie.",
          "Differenzialdiagnosen sprachlich klar priorisieren.",
          "Therapeutische Erstschritte mit begruendetem Timing benennen.",
          "Risikokommunikation und naechste Versorgungsetappe erklaeren."
        ]
      };
    case "upper_abdomen":
      return {
        anamnese: [
          "Schmerzort, Qualitaet und Ausstrahlung (Ruecken/Schulter) erfassen.",
          "Nahrungsbezug, Uebelkeit, Erbrechen, Stuhlveraenderung, Ikterus.",
          "Alkoholkonsum, NSAR-Einnahme, biliaere oder pankreatische Vorgeschichte.",
          "Fieber, Schuettelfrost, Appetitverlust, Gewichtsveraenderung.",
          "Voroperationen im Oberbauch und bekannte Leber-/Magenkrankheiten.",
          "Medikamente inkl. Antikoagulation und Protonenpumpenhemmer."
        ],
        untersuchung: [
          "Abdomeninspektion, Palpation (Abwehrspannung, Druckdolenz).",
          "Leber-/Milzgroesse, Murphy-Zeichen und epigastrischer Druckschmerz.",
          "Haut/Skleren auf Ikterus, Dehydratation, Blaesse.",
          "Auskultation Darmgeraeusche, Peritonismuszeichen.",
          "Vitalparameter mit Fokus auf Fieber und Kreislaufstabilitaet."
        ],
        redFlags: [
          "Peritonitischer Bauch, Abwehrspannung, Kreislaufinstabilitaet.",
          "Ikterus plus Fieber/Schmerz (Hinweis auf Cholangitis).",
          "Haematemesis/Melaena oder progrediente Anaemiezeichen.",
          "Starker guertelfoermiger Schmerz mit Erbrechen und AZ-Abfall."
        ],
        naechsteSchritte: [
          "Labordiagnostik (Entzuendung, Leber, Pankreas) gezielt priorisieren.",
          "Sonografie als fruehe bildgebende Basis, ggf. CT-Ergaenzung.",
          "Analgesie, Fluessigkeit, Nahrungsstrategie klar planen.",
          "Aufklaerung ueber Warnzeichen und Reevaluationszeitpunkt."
        ]
      };
    case "lower_abdomen":
      return {
        anamnese: [
          "Schmerzbeginn, Verlauf und Lokalisation (rechts/links/median).",
          "Stuhlgangveraenderung, Obstipation, Diarrhoe, Blutbeimengung.",
          "Fieber, Uebelkeit, Erbrechen, Appetitverlust, Meteorismus.",
          "Urologische und (falls relevant) gynaekologische Begleitsymptome.",
          "Voroperationen, bekannte Divertikulose/IBD oder Appendixvorgeschichte.",
          "Ernaehrungs-, Reise- und Antibiotikaanamnese."
        ],
        untersuchung: [
          "Gezielte Unterbauchpalpation mit Loslassschmerz und Abwehrspannung.",
          "Perkussion/Auskultation und Zeichen eines Ileus erfassen.",
          "Rektale Untersuchung je nach klinischer Situation erwaegen.",
          "Hydratationszustand und Kreislaufparameter beurteilen.",
          "Differenzierung viszeraler vs. parietaler Schmerzcharakteristik."
        ],
        redFlags: [
          "Progrediente Schmerzen mit Peritonismuszeichen.",
          "Ileusverdacht mit fehlendem Stuhl/Windabgang und Erbrechen.",
          "Fieber plus Tachykardie plus lokalisierte starke Druckdolenz.",
          "Blutige Stuehle oder deutlicher Allgemeinzustandsabfall."
        ],
        naechsteSchritte: [
          "Labor und Sonografie als erster strukturierter Diagnostikschritt.",
          "CT bei unklarer oder komplizierter Konstellation frueh erwaegen.",
          "Analgesie und Verlaufskontrolle engmaschig dokumentieren.",
          "Stationaere Einweisung bei red-flag-Konstellationen."
        ]
      };
    case "pelvis":
      return {
        anamnese: [
          "Miktionsbeschwerden: Dysurie, Pollakisurie, Harnverhalt, Inkontinenz.",
          "Flankenschmerz, Unterbauchschmerz, Fieber, Schuettelfrost.",
          "Makro-/Mikrohaematurie oder veraenderter Uringeruch.",
          "Vorinfektionen, Steinleiden, urologische Eingriffe/Operationen.",
          "Gynaekologische oder prostatabezogene Begleitanamnese je nach Geschlecht.",
          "Trinkmenge, Medikamente und nephrotoxische Substanzen."
        ],
        untersuchung: [
          "Unterbauchpalpation auf Blasenfuellung und Druckdolenz.",
          "Klopfschmerz Nierenlager beidseits.",
          "Temperatur, Puls, RR, Zeichen systemischer Infektion.",
          "Hydratation und Harnbilanzierung.",
          "Bei Bedarf fokussierte urologische Zusatzuntersuchung."
        ],
        redFlags: [
          "Fieber plus Flankenschmerz plus reduzierter Allgemeinzustand.",
          "Akuter Harnverhalt mit Schmerzen und fehlender Miktion.",
          "Makrohaematurie mit Koageln oder Kreislaufrelevanz.",
          "Sepsisverdacht bei urogenitalem Fokus."
        ],
        naechsteSchritte: [
          "Urinstatus/-kultur und laborchemische Entzuendungsabklaerung.",
          "Sonografie Harntrakt/Restharn zielgerichtet einsetzen.",
          "Fruehe antiinfektive oder entlastende Therapie je nach Befund.",
          "Nachsorgeplan mit Trink-/Warnzeichenberatung formulieren."
        ]
      };
    case "spine":
      return {
        anamnese: [
          "Rueckenschmerzlokalisation, Belastungsbezug und Schmerzdynamik.",
          "Radikulaere Symptome: Ausstrahlung, Kribbeln, Taubheit, Kraftverlust.",
          "Trauma, Ueberlastung, bekannte Bandscheiben-/Wirbelerkrankung.",
          "Fieber, Gewichtsverlust, Tumoranamnese, Immunsuppression.",
          "Miktions-/Defaekationsstoerung oder Sattelanaesthesie gezielt erfragen.",
          "Bisherige Therapie und Funktionseinschraenkung im Alltag."
        ],
        untersuchung: [
          "Inspektion Haltung, Beweglichkeit, Druckschmerz entlang Wirbelsaeule.",
          "Neurologischer Status (Kraft, Sensibilitaet, Reflexe).",
          "Lasègue/umgekehrter Lasègue je nach Beschwerdebild.",
          "Gangbild und Standstabilitaet.",
          "Fieber und systemische Warnzeichen erfassen."
        ],
        redFlags: [
          "Cauda-Equina-Zeichen (Sattelanaesthesie, Blasen-/Mastdarmstoerung).",
          "Neu progrediente motorische Ausfaelle.",
          "Infekt-/Tumorverdacht mit Nachtschmerz und Allgemeinsymptomen.",
          "Schmerz nach relevantem Trauma oder bei Osteoporoserisiko."
        ],
        naechsteSchritte: [
          "Strukturierte Schmerz- und Funktionsklassifikation.",
          "Fruehe Bildgebung bei red flags, sonst stufenweise Diagnostik.",
          "Multimodales Management (Analgesie, Mobilisation, Physio).",
          "Klare Sicherheitsnetze mit sofortigen Wiedervorstellungskriterien."
        ]
      };
    case "upper_arm":
    case "forearm_hand":
      return {
        anamnese: [
          "Verletzungsmechanismus oder Ueberlastungssituation genau erfragen.",
          "Schmerzort, Schwellung, Bewegungseinschraenkung, Kraftverlust.",
          "Paraesthesien, Taubheit, Kaeltegefuehl oder Farbveraenderungen.",
          "Dominante Hand, berufliche Belastung und Sportprofil.",
          "Vorverletzungen, Operationen, Arthrose-/Rheumaanamnese.",
          "Bisherige Schonung, Bandage, Analgetika und Effekt."
        ],
        untersuchung: [
          "Inspektion Achse, Schwellung, Haematom, Fehlstellung.",
          "Aktive/passive Beweglichkeit in Schulter/Ellenbogen/Handgelenk.",
          "Funktion von N. medianus, ulnaris, radialis orientierend testen.",
          "Durchblutung distal (Puls, Rekapillarisierung, Temperatur).",
          "Sehnen-/Bandstabilitaet je nach Verdacht differenziert pruefen."
        ],
        redFlags: [
          "Akute Durchblutungsstoerung oder neurologischer Ausfall.",
          "Offene Verletzung, Fehlstellung oder Frakturverdacht.",
          "Progrediente Schwellung mit Kompartmentsyndrom-Verdacht.",
          "Infektzeichen nach Punktion/Verletzung."
        ],
        naechsteSchritte: [
          "Ruhigstellung und schmerzarme Fruehversorgung.",
          "Bildgebung je nach Trauma- und Befundkonstellation.",
          "Neurovaskulaere Verlaufskontrollen dokumentieren.",
          "Patientenhinweise zu Belastung, Schwellungsmanagement, Kontrolle."
        ]
      };
    case "leg":
      return {
        anamnese: [
          "Schmerzlokalisation (Huefte/Knie/Unterschenkel/Fuss) praezisieren.",
          "Trauma, Verdrehung, Sturz, sportliche Belastung erheben.",
          "Belastbarkeit: Gehen, Treppen, Standzeit, Instabilitaetsgefuehl.",
          "Schwellung, Ueberwaermung, Roetung, naechtlicher Schmerz.",
          "Thromboserisiko, Voroperationen, bekannte Gelenkerkrankungen.",
          "Neurologische Begleitsymptome oder Claudicatiozeichen."
        ],
        untersuchung: [
          "Inspektion Achse, Umfangsdifferenz, Haematom, Erguss.",
          "Beweglichkeit und Band-/Meniskuszeichen am Knie (falls passend).",
          "Palpation entlang Femur, Tibia, Fibula, Achillessehne.",
          "Durchblutung, Sensibilitaet und Motorik distal sichern.",
          "Gangbild und schmerzadaptierte Belastungsprobe."
        ],
        redFlags: [
          "Unfaehigkeit zu belasten nach Trauma.",
          "Schwellung + Dyspnoe/Thoraxschmerz (Thromboembolieverdacht).",
          "Akute Durchblutungsstoerung oder motorischer Ausfall.",
          "Heftiger Waden-/Sehnenschmerz mit Funktionsverlust."
        ],
        naechsteSchritte: [
          "Sofortige Stabilisierung und Schmerzmanagement.",
          "Bildgebung/Thrombosediagnostik indikationsgerecht priorisieren.",
          "Funktionelle Nachkontrolle und Belastungsaufbau planen.",
          "Warnzeichen fuer Notfallwiedervorstellung klar benennen."
        ]
      };
    default:
      return {
        anamnese: ["Beschwerdebeginn, Verlauf und Belastungsbezug systematisch erheben."],
        untersuchung: ["Koerperliche Untersuchung regionenspezifisch strukturieren."],
        redFlags: ["Warnzeichen aktiv erfragen und dokumentieren."],
        naechsteSchritte: ["Diagnostik und Therapie patientengerecht erklaeren."]
      };
  }
}

function getLearningBodyRegionFigureSet(region) {
  const sourceFigures = BODY_ATLAS_REGION_SOURCE_FIGURES_BY_ID[region.id] || [];
  const seenSources = new Set();
  const figures = [];

  sourceFigures.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const src = safeLine(entry.src || "", 500);
    if (!src) return;
    const key = src.toLowerCase();
    if (seenSources.has(key)) return;
    seenSources.add(key);
    figures.push({
      title:
        safeLine(entry.title || "", 180) || `${region.label}: Anatomische Detailansicht ${index + 1}`,
      description:
        safeParagraph(entry.description || "", 280) ||
        "Nummerierte anatomische Darstellung mit fachlich ueblichen Strukturen.",
      src,
      sourceLabel: safeLine(entry.sourceLabel || "Wikimedia Commons", 80) || "Wikimedia Commons",
      sourceUrl: src
    });
  });

  if (figures.length > 0) return figures;

  return [
    {
      title: `${region.label}: Anatomische Detailansicht`,
      description: "Fallback auf Ganzkoerpergrafik, da keine Regionsquelle hinterlegt ist.",
      src: BODY_ATLAS_MAP_IMAGE_SRC,
      sourceLabel: "Servier Medical Art",
      sourceUrl: "https://smart.servier.com/"
    }
  ];
}

function getLearningBodyHitbox(region) {
  const override = BODY_ATLAS_HITBOX_OVERRIDE_BY_ID[region?.id || ""];
  if (override) {
    return {
      left: Number(override.left) || 40,
      top: Number(override.top) || 40,
      width: Number(override.width) || 20,
      height: Number(override.height) || 20,
      transform: safeLine(override.transform || "", 48),
      originX: Number.isFinite(Number(override.originX)) ? Number(override.originX) : 50,
      originY: Number.isFinite(Number(override.originY)) ? Number(override.originY) : 50
    };
  }

  const shape = region?.map;
  if (!shape || typeof shape !== "object") {
    return { left: 40, top: 40, width: 20, height: 20, transform: "", originX: 50, originY: 50 };
  }

  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  if (shape.type === "rect") {
    x = Number(shape.x) || 0;
    y = Number(shape.y) || 0;
    width = Number(shape.width) || 0;
    height = Number(shape.height) || 0;
  } else if (shape.type === "ellipse") {
    const cx = Number(shape.cx) || 0;
    const cy = Number(shape.cy) || 0;
    const rx = Number(shape.rx) || 0;
    const ry = Number(shape.ry) || 0;
    x = cx - rx;
    y = cy - ry;
    width = rx * 2;
    height = ry * 2;
  } else {
    x = 120;
    y = 220;
    width = 80;
    height = 100;
  }

  const left = Math.max(0, Math.min(98, (x / 320) * 100));
  const top = Math.max(0, Math.min(98, (y / 640) * 100));
  const safeWidth = Math.max(3, Math.min(98, (width / 320) * 100));
  const safeHeight = Math.max(3, Math.min(98, (height / 640) * 100));

  let transform = "";
  let originX = left + safeWidth / 2;
  let originY = top + safeHeight / 2;
  const transformText = String(shape.transform || "");
  const rotateMatch = transformText.match(/rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/);
  if (rotateMatch) {
    const angle = Number(rotateMatch[1]) || 0;
    const cx = Number(rotateMatch[2]) || 160;
    const cy = Number(rotateMatch[3]) || 320;
    transform = `rotate(${angle}deg)`;
    originX = Math.max(0, Math.min(100, (cx / 320) * 100));
    originY = Math.max(0, Math.min(100, (cy / 640) * 100));
  }

  return {
    left,
    top,
    width: safeWidth,
    height: safeHeight,
    transform,
    originX,
    originY
  };
}

function renderLearningBodyMap() {
  if (!refs.learningBodyCanvas) return;
  refs.learningBodyCanvas.innerHTML = "";

  const stage = document.createElement("div");
  stage.className = "learning-body-map-stage";

  const image = document.createElement("img");
  image.className = "learning-body-map-image";
  image.src = BODY_ATLAS_MAP_IMAGE_SRC;
  image.alt = "Ganzkoerpermodell";
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    stage.classList.add("is-image-missing");
    if (refs.learningBodyStatus) {
      refs.learningBodyStatus.textContent =
        "Koerpermodell konnte nicht geladen werden. Bitte Seite neu laden.";
    }
  });
  stage.appendChild(image);

  const overlay = document.createElement("div");
  overlay.className = "learning-body-map-overlay";
  BODY_ATLAS_REGIONS.forEach((region) => {
    const hitbox = document.createElement("button");
    hitbox.type = "button";
    hitbox.className = "learning-body-map-hitbox";
    hitbox.dataset.regionId = region.id;
    hitbox.setAttribute("aria-label", region.label);
    hitbox.title = region.label;
    const box = getLearningBodyHitbox(region);
    hitbox.style.left = `${box.left}%`;
    hitbox.style.top = `${box.top}%`;
    hitbox.style.width = `${box.width}%`;
    hitbox.style.height = `${box.height}%`;
    if (box.transform) {
      hitbox.style.transform = box.transform;
      hitbox.style.transformOrigin = `${box.originX}% ${box.originY}%`;
    }
    hitbox.addEventListener("mouseenter", () => {
      if (refs.learningBodyStatus) {
        refs.learningBodyStatus.textContent = `${region.order}. ${region.label}`;
      }
    });
    hitbox.addEventListener("focus", () => {
      if (refs.learningBodyStatus) {
        refs.learningBodyStatus.textContent = `${region.order}. ${region.label}`;
      }
    });
    hitbox.addEventListener("click", () => {
      openLearningBodyRegionDetail(region.id);
    });
    overlay.appendChild(hitbox);
  });
  stage.appendChild(overlay);
  refs.learningBodyCanvas.appendChild(stage);
}

function renderLearningBodyView() {
  const activeRegion = getLearningBodyRegionById(state.learningBodyActiveRegionId);
  if (!activeRegion) return;
  state.learningBodyActiveRegionId = activeRegion.id;
  if (state.learningBodyDetailOpen) {
    renderLearningBodyRegionDetail(activeRegion);
  } else {
    renderLearningBodySelection();
  }
  if (refs.learningBodyStatus && !refs.learningBodyStatus.textContent.trim()) {
    refs.learningBodyStatus.textContent =
      "Tippe auf die gewuenschte Koerperregion im Modell. Die Unterteilung bleibt unsichtbar.";
  }
}

function renderLearningBodySelection() {
  state.learningBodyDetailOpen = false;
  if (refs.learningBodySelectionView) refs.learningBodySelectionView.classList.remove("hidden");
  if (refs.learningBodyRegionDetailView) refs.learningBodyRegionDetailView.classList.add("hidden");
  renderLearningBodyMap();
  if (refs.learningBodyStatus) {
    refs.learningBodyStatus.textContent =
      "Tippe auf die gewuenschte Koerperregion im Modell. Danach oeffnet sich nur diese Region.";
  }
}

function openLearningBodyRegionDetail(regionId) {
  const region = getLearningBodyRegionById(regionId);
  if (!region) return;
  state.learningBodyActiveRegionId = region.id;
  state.learningBodyDetailOpen = true;
  renderLearningBodyRegionDetail(region);
}

function renderLearningBodyRegionDetail(region) {
  const deepDive = getLearningBodyDeepDive(region);
  const detailedTerms = getLearningBodyRegionDetailedTerms(region);
  state.learningBodyDetailOpen = true;
  if (refs.learningBodySelectionView) refs.learningBodySelectionView.classList.add("hidden");
  if (refs.learningBodyRegionDetailView) refs.learningBodyRegionDetailView.classList.remove("hidden");
  if (refs.learningBodyRegionTitle) refs.learningBodyRegionTitle.textContent = `${region.order}. ${region.label}`;
  if (refs.learningBodyRegionHint) refs.learningBodyRegionHint.textContent = region.hint;
  if (refs.learningBodyStatus) {
    refs.learningBodyStatus.textContent =
      `${region.label}: nummerierte Quellgrafiken mit klinischer Vertiefung.`;
  }

  if (refs.learningBodyRegionGallery) {
    refs.learningBodyRegionGallery.innerHTML = "";
    const figures = getLearningBodyRegionFigureSet(region);
    figures.forEach((figure, figureIndex) => {
      const card = document.createElement("article");
      card.className = "learning-body-figure";

      const heading = document.createElement("h6");
      heading.className = "learning-body-figure-title";
      heading.textContent = `Bild ${figureIndex + 1}: ${figure.title}`;
      card.appendChild(heading);

      const caption = document.createElement("p");
      caption.className = "learning-body-figure-caption";
      caption.textContent = figure.description;
      card.appendChild(caption);

      const imageWrap = document.createElement("div");
      imageWrap.className = "learning-body-figure-image-wrap";
      const image = document.createElement("img");
      image.className = "learning-body-figure-image";
      image.src = figure.src;
      image.alt = `${figure.title} (nummerierte anatomische Darstellung)`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        imageWrap.classList.add("is-image-missing");
      });
      imageWrap.appendChild(image);
      card.appendChild(imageWrap);

      const sourceUrl = safeLine(figure.sourceUrl || "", 500);
      if (sourceUrl) {
        const source = document.createElement("p");
        source.className = "learning-body-figure-source";
        const sourceLabel = document.createElement("span");
        sourceLabel.textContent = "Quelle: ";
        source.appendChild(sourceLabel);
        const sourceLink = document.createElement("a");
        sourceLink.href = sourceUrl;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = safeLine(figure.sourceLabel || "Bildquelle", 80) || "Bildquelle";
        source.appendChild(sourceLink);
        card.appendChild(source);
      }
      refs.learningBodyRegionGallery.appendChild(card);
    });
  }

  if (refs.learningBodyRegionDeepDive) {
    refs.learningBodyRegionDeepDive.innerHTML = "";
    const sections = [
      { title: "Gezielte Anamnesefragen", items: deepDive.anamnese },
      { title: "Untersuchungsfokus", items: deepDive.untersuchung },
      { title: "Red Flags", items: deepDive.redFlags },
      { title: "Priorisierte naechste Schritte", items: deepDive.naechsteSchritte }
    ];
    sections.forEach((section) => {
      const card = document.createElement("article");
      card.className = "learning-body-deep-card";
      const heading = document.createElement("h6");
      heading.className = "learning-body-deep-title";
      heading.textContent = section.title;
      card.appendChild(heading);
      const list = document.createElement("ul");
      list.className = "learning-body-deep-list";
      section.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      card.appendChild(list);
      refs.learningBodyRegionDeepDive.appendChild(card);
    });
  }

  if (refs.learningBodyRegionBullets) {
    refs.learningBodyRegionBullets.innerHTML = "";
    detailedTerms.forEach((hotspot, index) => {
      const li = document.createElement("li");
      li.className = "learning-body-coverage-item";
      li.innerHTML = `
        <strong>${index + 1}. ${hotspot.fach}</strong>
        <span class="learning-body-coverage-line">Patientensprache: ${hotspot.patient}</span>
        <span class="learning-body-coverage-line">Klinischer Fokus: ${hotspot.info}</span>
      `;
      refs.learningBodyRegionBullets.appendChild(li);
    });
  }
}

function stopLearningBodyModelLoop() {
  // Kein 3D-Loop mehr noetig im 2D-Atlas.
}

function renderLearningReadingMode(categories) {
  const activeCategory =
    categories.find((entry) => entry.id === state.learningActiveCategoryId) || categories[0] || null;
  if (!activeCategory) {
    renderLearningLoading("Kategorie konnte nicht geladen werden.");
    return;
  }
  if (activeCategory.id !== state.learningActiveCategoryId) {
    state.learningActiveCategoryId = activeCategory.id;
  }

  if (refs.learningReadingTitle) refs.learningReadingTitle.textContent = activeCategory.title;
  if (refs.learningReadingMeta) {
    refs.learningReadingMeta.textContent = [activeCategory.focus, `${activeCategory.questionCount} Fragen`]
      .filter((item) => Boolean(item))
      .join(" | ");
  }
  if (refs.learningReadingStatus) refs.learningReadingStatus.textContent = "";

  if (refs.learningBackAvatar) {
    refs.learningBackAvatar.src = refs.levelAvatar?.src || "assets/levels/level-0.png";
  }
  if (refs.learningReadingText) {
    refs.learningReadingText.innerHTML = "";
    if (activeCategory.summary) {
      const lead = document.createElement("p");
      lead.className = "learning-reading-summary";
      lead.textContent = activeCategory.summary;
      refs.learningReadingText.appendChild(lead);
    }
    for (const paragraph of activeCategory.learningText) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      refs.learningReadingText.appendChild(p);
    }
  }

  if (refs.learningReadingQuestionGroups) {
    refs.learningReadingQuestionGroups.innerHTML = "";
    for (const group of activeCategory.questionGroups) {
      const block = document.createElement("article");
      block.className = "learning-question-group";
      const heading = document.createElement("h6");
      heading.textContent = group.title;
      block.appendChild(heading);
      const list = document.createElement("ol");
      for (const question of group.questions) {
        const li = document.createElement("li");
        li.textContent = question;
        list.appendChild(li);
      }
      block.appendChild(list);
      refs.learningReadingQuestionGroups.appendChild(block);
    }
  }

  if (refs.learningReadingSources) {
    refs.learningReadingSources.innerHTML = "";
    if (activeCategory.sourceTags.length > 0) {
      const heading = document.createElement("p");
      heading.className = "learning-sources-title";
      heading.textContent = "Leitlinienbasis";
      refs.learningReadingSources.appendChild(heading);

      const list = document.createElement("ul");
      list.className = "learning-sources-list";
      for (const sourceTag of activeCategory.sourceTags) {
        const li = document.createElement("li");
        li.textContent = sourceTag;
        list.appendChild(li);
      }
      refs.learningReadingSources.appendChild(list);
    }
  }
}

function flattenCards(deck) {
  const cards = [];
  for (const term of deck.terms || []) {
    const termId = String(term.termId || "");
    const category = termId.startsWith("online_kurs_")
      ? "online kurs"
      : CATEGORY_MAP[termId] || "Allgemein";
    for (const card of term.cards || []) {
      cards.push({
        ...card,
        termId,
        fachbegriff: term.fachbegriff,
        patientensprache: term.patientensprache,
        category
      });
    }
  }
  return cards;
}

function buildCategories(cards) {
  const unique = new Set(cards.map((card) => card.category));
  return ["all", ...Array.from(unique).sort()];
}

function renderCategoryFilters() {
  refs.categoryFilters.innerHTML = "";
  for (const category of state.categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip ${state.selectedCategory === category ? "active" : ""}`;
    button.textContent = category === "all" ? "Alle" : category;
    button.addEventListener("click", () => {
      state.selectedCategory = category;
      state.currentIndex = 0;
      renderCategoryFilters();
      renderFolderFilters();
      if (state.isImmersive) {
        rebuildQueue(false);
      } else {
        enterImmersiveMode();
      }
    });
    refs.categoryFilters.appendChild(button);
  }
}

function renderFolderFilters() {
  refs.folderFilters.innerHTML = "";
  for (const folder of FOLDERS) {
    const count = getFilteredCards(folder.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `folder ${state.selectedFolder === folder.id ? "active" : ""}`;
    const shortLabel = FOLDER_SHORT_LABELS[folder.id] || folder.label;
    button.innerHTML = `<span class="folder-title"><span class="folder-title-full">${folder.label}</span><span class="folder-title-short">${shortLabel}</span></span><span class="folder-count">${count}</span>`;
    button.addEventListener("click", () => {
      state.selectedFolder = folder.id;
      state.currentIndex = 0;
      renderFolderFilters();
      rebuildQueue(false);
    });
    refs.folderFilters.appendChild(button);
  }
}

function rebuildQueue(isManualShuffle) {
  state.queue = getFilteredCards(state.selectedFolder);
  if (isManualShuffle) {
    shuffleInPlace(state.queue);
  }
  state.currentIndex = 0;
  state.answered = false;
  renderQueueInfo();
  updateStartButtonState();
  if (state.isImmersive) {
    renderCard();
  }
}

function getFilteredCards(folderId) {
  const byCategory = state.cards.filter((card) => {
    if (state.selectedCategory === "all") {
      return true;
    }
    return card.category === state.selectedCategory;
  });

  if (folderId === "regular") {
    return buildRegularQueue(byCategory);
  }

  return byCategory.filter((card) => cardInFolder(card, folderId));
}

function cardInFolder(card, folderId) {
  const progress = getProgress(card.cardId);
  const streak = progress.streak || 0;
  const introduced = Boolean(progress.introduced);
  const isDiamond = streak >= 7;
  const wasLastWrong = progress.lastResult === false;
  const wasLastRight = progress.lastResult === true;

  if (folderId === "all") return true;
  if (folderId === "diamonds") return isDiamond;
  if (folderId === "new") return !introduced;
  if (folderId === "one_right") return !isDiamond && introduced && wasLastRight && streak === 1;
  if (folderId === "unsure") return !isDiamond && introduced && wasLastWrong;
  if (folderId === "streak_2") return !isDiamond && introduced && wasLastRight && streak === 2;
  if (folderId === "streak_3") return !isDiamond && introduced && wasLastRight && streak === 3;
  if (folderId === "streak_4") return !isDiamond && introduced && wasLastRight && streak === 4;
  if (folderId === "streak_5") return !isDiamond && introduced && wasLastRight && streak === 5;
  if (folderId === "streak_6") return !isDiamond && introduced && wasLastRight && streak === 6;
  return true;
}

function buildRegularQueue(cards) {
  const buckets = {
    new: [],
    one_right: [],
    unsure: [],
    streak_2: [],
    streak_3: [],
    streak_4: [],
    streak_5: [],
    streak_6: []
  };

  for (const card of cards) {
    const progress = getProgress(card.cardId);
    const streak = progress.streak || 0;
    const introduced = Boolean(progress.introduced);
    const isDiamond = streak >= 7;
    if (isDiamond) continue;

    if (!introduced) {
      buckets.new.push(card);
      continue;
    }

    if (progress.lastResult === false) {
      buckets.unsure.push(card);
      continue;
    }

    if (streak === 1) buckets.one_right.push(card);
    else if (streak === 2) buckets.streak_2.push(card);
    else if (streak === 3) buckets.streak_3.push(card);
    else if (streak === 4) buckets.streak_4.push(card);
    else if (streak === 5) buckets.streak_5.push(card);
    else if (streak === 6) buckets.streak_6.push(card);
    else buckets.unsure.push(card);
  }

  shuffleInPlace(buckets.new);
  shuffleInPlace(buckets.one_right);
  shuffleInPlace(buckets.unsure);
  shuffleInPlace(buckets.streak_2);
  shuffleInPlace(buckets.streak_3);
  shuffleInPlace(buckets.streak_4);
  shuffleInPlace(buckets.streak_5);
  shuffleInPlace(buckets.streak_6);

  const remainingNewSlots = getRemainingNewSlotsToday();
  if (buckets.new.length > remainingNewSlots) {
    buckets.new = buckets.new.slice(0, remainingNewSlots);
  }

  const queue = [];
  while (true) {
    let added = false;
    for (const bucketId of REGULAR_PATTERN) {
      const bucket = buckets[bucketId];
      if (!bucket || bucket.length === 0) continue;
      queue.push(bucket.pop());
      added = true;
    }
    if (!added) break;
  }

  return queue;
}

function renderQueueInfo() {
  const label = FOLDERS.find((folder) => folder.id === state.selectedFolder)?.label || "Ordner";
  const categoryLabel = state.selectedCategory === "all" ? "Alle Kategorien" : state.selectedCategory;
  if (state.selectedFolder === "regular") {
    refs.queueInfo.textContent = `${label}: ${state.queue.length} Karte(n) in ${categoryLabel} | Neue heute frei: ${getRemainingNewSlotsToday()}`;
    return;
  }
  refs.queueInfo.textContent = `${label}: ${state.queue.length} Karte(n) in ${categoryLabel}`;
}

function updateStartButtonState() {
  // Intentional no-op: practice starts via the dedicated "Üben" action.
}

function enterImmersiveMode() {
  state.isImmersive = true;
  document.body.classList.add("immersive");
  refs.quizPanel.classList.remove("hidden");
  renderSessionXpDisplay();
  rebuildQueue(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitImmersiveMode() {
  state.isImmersive = false;
  document.body.classList.remove("immersive");
  refs.quizPanel.classList.add("hidden");
  renderSessionXpDisplay();
}

function renderCard() {
  const card = state.queue[state.currentIndex];
  refs.progressText.textContent = `Karte ${state.queue.length === 0 ? 0 : state.currentIndex + 1} von ${state.queue.length}`;

  if (!card) {
    refs.cardBox.classList.add("hidden");
    refs.emptyState.classList.remove("hidden");
    refs.feedbackBox.classList.add("hidden");
    refs.questionText.classList.remove("story-text", "differential-answer");
    state.revealPhase = null;
    state.currentChoices = [];
    state.currentCorrectIndex = -1;
    return;
  }

  refs.emptyState.classList.add("hidden");
  refs.cardBox.classList.remove("hidden");
  refs.feedbackBox.classList.add("hidden");

  const isStoryText = card.type === "story_text";
  const isDifferentialText = card.type === "differenzial_text";

  state.revealPhase = null;
  refs.cardMode.textContent = MODE_LABELS[card.type] || "Modus";
  refs.cardCategory.textContent = card.category;
  refs.questionText.textContent = card.question;
  refs.questionText.classList.remove("differential-answer");
  refs.questionText.classList.toggle("story-text", isStoryText || isDifferentialText);

  state.currentChoices = [];
  state.currentCorrectIndex = -1;

  refs.resultText.textContent = "";
  refs.resultText.className = "result-line";
  refs.translationText.textContent = card.translation_es || "";
  refs.explanationText.textContent = card.explanation_de || "";

  refs.feedbackBox.classList.remove("text-card-nav");
  refs.choices.classList.remove("hidden");
  refs.resultText.classList.remove("hidden");
  refs.explanationText.classList.remove("hidden");
  refs.translationText.classList.remove("hidden");
  refs.nextBtn.textContent = "Naechste Karte";

  refs.choices.innerHTML = "";

  if (isStoryText) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.add("hidden");
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    state.answered = true;
    return;
  }

  if (isDifferentialText) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.add("hidden");
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    refs.nextBtn.textContent = "Bereit";
    state.revealPhase = "prompt";
    state.answered = true;
    return;
  }

  const hasValidChoices = Array.isArray(card.choices) && card.choices.length >= 2;
  const hasValidCorrectIndex =
    Number.isInteger(card.correctIndex) &&
    card.correctIndex >= 0 &&
    card.correctIndex < (card.choices?.length || 0);
  if (!hasValidChoices || !hasValidCorrectIndex) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.remove("hidden");
    refs.resultText.classList.add("bad");
    refs.resultText.textContent = "Karte unvollstaendig. Bitte Deck-Daten pruefen.";
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    state.answered = true;
    return;
  }

  const shuffledChoices = card.choices.map((choice, originalIndex) => ({
    choice,
    originalIndex
  }));
  shuffleInPlace(shuffledChoices);

  state.currentChoices = shuffledChoices.map((entry) => entry.choice);
  state.currentCorrectIndex = shuffledChoices.findIndex(
    (entry) => entry.originalIndex === card.correctIndex
  );

  state.currentChoices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = `${String.fromCharCode(65 + index)}) ${choice}`;
    button.addEventListener("click", () => handleAnswer(index));
    refs.choices.appendChild(button);
  });

  state.answered = false;
}

function handleAnswer(selectedIndex) {
  if (state.answered) return;
  const card = state.queue[state.currentIndex];
  if (!card || card.type === "story_text" || card.type === "differenzial_text") return;

  state.answered = true;
  const correctIndex = state.currentCorrectIndex;
  if (correctIndex < 0) return;

  const isCorrect = selectedIndex === correctIndex;
  const choiceButtons = Array.from(refs.choices.querySelectorAll(".choice"));

  choiceButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) {
      button.classList.add("correct");
    } else if (index === selectedIndex && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  refs.feedbackBox.classList.remove("hidden");
  if (isCorrect) {
    refs.resultText.textContent = "Richtig. Stark gemacht.";
    refs.resultText.classList.add("ok");
  } else {
    refs.resultText.textContent = `Nicht ganz. Richtig ist: ${state.currentChoices[correctIndex]}`;
    refs.resultText.classList.add("bad");
  }

  saveAttempt(card.cardId, isCorrect);
  renderFolderFilters();
  renderQueueInfo();
  updateStartButtonState();
  renderStats();
}

function markPassiveCardAsRead(card) {
  if (!card) return;
  if (card.type !== "story_text" && card.type !== "differenzial_text") return;
  if (card.type === "differenzial_text" && state.revealPhase !== "answer") return;

  saveAttempt(card.cardId, true);
  renderFolderFilters();
  renderQueueInfo();
  updateStartButtonState();
  renderStats();
}

function showDifferentialAnswer(card) {
  if (!card || card.type !== "differenzial_text") return;

  refs.questionText.textContent = card.answer_de || "Keine Antwort hinterlegt.";
  refs.questionText.classList.add("story-text", "differential-answer");
  refs.feedbackBox.classList.remove("hidden");
  refs.feedbackBox.classList.add("text-card-nav");
  refs.nextBtn.textContent = "Naechste Karte";
  state.revealPhase = "answer";
}

function triggerHeartBurst() {
  const emoji = SWEET_EMOJIS[Math.floor(Math.random() * SWEET_EMOJIS.length)];
  const driftX = Math.floor(Math.random() * 61) - 30;
  const rotation = Math.floor(Math.random() * 41) - 20;

  if (activeCelebration) {
    activeCelebration.remove();
    activeCelebration = null;
  }

  const celebration = document.createElement("div");
  celebration.className = "floating-emoji";
  celebration.textContent = emoji;
  celebration.style.setProperty("--emoji-x", `${driftX}px`);
  celebration.style.setProperty("--emoji-rot", `${rotation}deg`);

  document.body.appendChild(celebration);
  activeCelebration = celebration;

  void celebration.offsetWidth;
  celebration.classList.add("show");

  if (emojiHideTimer) {
    window.clearTimeout(emojiHideTimer);
  }

  emojiHideTimer = window.setTimeout(() => {
    celebration.classList.remove("show");
    celebration.classList.add("hide");
    window.setTimeout(() => {
      if (celebration.parentNode) {
        celebration.remove();
      }
      if (activeCelebration === celebration) {
        activeCelebration = null;
      }
    }, 500);
  }, 2400);
}

function nextCard() {
  if (!state.queue.length) return;

  const currentCard = state.queue[state.currentIndex];

  if (currentCard?.type === "differenzial_text" && state.revealPhase === "prompt") {
    showDifferentialAnswer(currentCard);
    return;
  }

  markPassiveCardAsRead(currentCard);

  if (state.currentIndex < state.queue.length - 1) {
    state.currentIndex += 1;
    renderCard();
    return;
  }

  rebuildQueue(true);
}

function saveAttempt(cardId, isCorrect) {
  const progress = getProgress(cardId);
  progress.introduced = true;
  if (!progress.introducedDate) {
    progress.introducedDate = todayKey();
  }

  progress.attempts = (progress.attempts || 0) + 1;
  progress.correct = (progress.correct || 0) + (isCorrect ? 1 : 0);
  progress.lastDate = todayKey();
  progress.lastResult = isCorrect;
  if (isCorrect) {
    progress.streak = Math.min((progress.streak || 0) + 1, 7);
    if (progress.streak >= 7) {
      progress.diamondSince = todayKey();
    }
    state.sessionXp = normalizeXpValue(state.sessionXp) + 1;
    triggerHeartBurst();
    awardXp(1);
  } else {
    progress.streak = 0;
    progress.diamondSince = "";
  }

  const day = ensureDayStats(todayKey());
  day.attempts += 1;
  if (isCorrect) day.correct += 1;
  else day.wrong += 1;

  saveToStorage(STORAGE_PROGRESS_KEY, state.progress);
  saveToStorage(STORAGE_DAILY_KEY, state.dailyStats);
  scheduleRemoteSync();
}

function ensureDayStats(dayKey) {
  if (!state.dailyStats[dayKey]) {
    state.dailyStats[dayKey] = { attempts: 0, correct: 0, wrong: 0 };
  }
  return state.dailyStats[dayKey];
}

function awardXp(amount) {
  const gain = normalizeXpValue(amount);
  if (gain <= 0) return;

  const previousXp = normalizeXpValue(state.xp);
  const nextXp = previousXp + gain;
  state.xp = nextXp;
  saveToStorage(STORAGE_XP_KEY, { total: nextXp });

  const previousStep = Math.floor(previousXp / 10);
  const currentStep = Math.floor(nextXp / 10);
  if (currentStep > previousStep) {
    showXpMilestone(`+${(currentStep - previousStep) * 10} XP`);
  }
}

function showXpMilestone(text) {
  if (!refs.xpMilestone) return;
  refs.xpMilestone.textContent = text;
  refs.xpMilestone.classList.remove("hidden");
  refs.xpMilestone.classList.remove("show");
  void refs.xpMilestone.offsetWidth;
  refs.xpMilestone.classList.add("show");

  if (xpMilestoneHideTimer) {
    window.clearTimeout(xpMilestoneHideTimer);
  }
  xpMilestoneHideTimer = window.setTimeout(() => {
    refs.xpMilestone.classList.remove("show");
    refs.xpMilestone.classList.add("hidden");
  }, 1500);
}

function renderStats() {
  const day = ensureDayStats(todayKey());
  const rate = day.attempts > 0 ? Math.round((day.correct / day.attempts) * 100) : 0;
  const todayXp = normalizeXpValue(day.correct);
  const dailyGoal = normalizeDailyGoal(state.dailyGoal);

  refs.todayAttempts.textContent = String(day.attempts);
  refs.todayCorrect.textContent = String(day.correct);
  refs.todayWrong.textContent = String(day.wrong);
  refs.todayRate.textContent = `${rate}%`;
  refs.kpiGoal.textContent = `${todayXp} / ${dailyGoal} XP`;
  refs.kpiAccuracy.textContent = `${rate}%`;
  refs.kpiStreak.textContent = `${computeStreak()} Tage`;

  renderDailyGoalDisplay(todayXp, dailyGoal);
  renderSessionXpDisplay();
  renderWeekChart();
  renderXpDisplay();
}

function renderDailyGoalDisplay(todayXp, dailyGoal) {
  if (!refs.dailyGoalText || !refs.dailyGoalFill || !refs.dailyGoalPanel) return;
  const progress = dailyGoal > 0 ? Math.min(100, Math.round((todayXp / dailyGoal) * 100)) : 0;
  refs.dailyGoalText.textContent = `Heute ${todayXp} / ${dailyGoal} XP`;
  refs.dailyGoalFill.style.width = `${progress}%`;
  refs.dailyGoalPanel.setAttribute("aria-valuemin", "0");
  refs.dailyGoalPanel.setAttribute("aria-valuemax", String(dailyGoal));
  refs.dailyGoalPanel.setAttribute("aria-valuenow", String(Math.min(todayXp, dailyGoal)));
  refs.dailyGoalPanel.classList.toggle("done", todayXp >= dailyGoal);
}

function renderSessionXpDisplay() {
  if (!refs.sessionXpStrip || !refs.sessionXpFill || !refs.sessionXpText) return;
  const sessionXp = normalizeXpValue(state.sessionXp);
  const percent = Math.max(0, Math.min(100, sessionXp));
  refs.sessionXpFill.style.width = `${percent}%`;
  refs.sessionXpText.textContent = `Session XP: ${sessionXp}`;
  refs.sessionXpStrip.setAttribute("aria-valuenow", String(percent));
}

function renderXpDisplay() {
  const xp = normalizeXpValue(state.xp);
  const blockProgress = xp % 10;
  const percent = Math.round((blockProgress / 10) * 100);

  refs.levelBadge.textContent = `XP ${xp}`;
  refs.levelTitle.textContent = "Trainingspunkte";
  refs.levelProgressText.textContent = `${blockProgress} / 10 bis +10 XP`;
  refs.levelFill.style.width = `${percent}%`;
  if (refs.topXpText) {
    refs.topXpText.textContent = `Gesamt XP ${xp}`;
  }

  const track = refs.levelFill.parentElement;
  if (track) {
    track.setAttribute("aria-label", "XP Fortschritt bis +10");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "10");
    track.setAttribute("aria-valuenow", String(blockProgress));
  }

  if (!refs.levelAvatar.dataset.sources) {
    applyLevelAvatarSources(buildLevelAssetCandidates(1));
  }
}

function renderWeekChart() {
  refs.weekChart.innerHTML = "";
  const lastDays = getLastDays(7);
  const maxAttempts = Math.max(
    1,
    ...lastDays.map((dayKey) => state.dailyStats[dayKey]?.attempts || 0)
  );

  for (const dayKey of lastDays) {
    const item = state.dailyStats[dayKey] || { attempts: 0, correct: 0, wrong: 0 };
    const accuracy =
      item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0;
    const barHeight = Math.max(6, Math.round((item.attempts / maxAttempts) * 120));

    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${barHeight}px`;
    bar.title = `${dayKey}: ${item.attempts} Karten, ${accuracy}%`;

    const meta = document.createElement("div");
    meta.className = "bar-meta";
    meta.textContent = `${item.attempts} | ${accuracy}%`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = shortDay(dayKey);

    wrap.appendChild(bar);
    wrap.appendChild(meta);
    wrap.appendChild(label);
    refs.weekChart.appendChild(wrap);
  }
}

function openStatsOverlay() {
  if (!state.user) return;
  refs.statsOverlay.classList.remove("hidden");
  refs.statsOverlay.setAttribute("aria-hidden", "false");
}

function closeStatsOverlay() {
  refs.statsOverlay.classList.add("hidden");
  refs.statsOverlay.setAttribute("aria-hidden", "true");
}

function computeStreak() {
  const days = getLastDays(30).reverse();
  let streak = 0;
  for (const dayKey of days) {
    if ((state.dailyStats[dayKey]?.attempts || 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function createSupabaseStorage() {
  const memoryStore = {};
  const localStorageRef = getStorageOrNull("localStorage");
  const sessionStorageRef = getStorageOrNull("sessionStorage");
  const primaryStorage = localStorageRef || sessionStorageRef;

  return {
    getItem(key) {
      try {
        if (primaryStorage) {
          const value = primaryStorage.getItem(key);
          if (value !== null) return value;
        }
      } catch (error) {
        console.warn("Auth storage getItem fehlgeschlagen", error);
      }
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    setItem(key, value) {
      try {
        if (primaryStorage) {
          primaryStorage.setItem(key, value);
          return;
        }
      } catch (error) {
        console.warn("Auth storage setItem fehlgeschlagen", error);
      }
      memoryStore[key] = value;
    },
    removeItem(key) {
      try {
        if (localStorageRef) {
          localStorageRef.removeItem(key);
        }
      } catch (error) {
        console.warn("Auth storage removeItem (local) fehlgeschlagen", error);
      }
      try {
        if (sessionStorageRef) {
          sessionStorageRef.removeItem(key);
        }
      } catch (error) {
        console.warn("Auth storage removeItem (session) fehlgeschlagen", error);
      }
      delete memoryStore[key];
    }
  };
}

function getStorageOrNull(storageName) {
  try {
    return window[storageName] || null;
  } catch (error) {
    return null;
  }
}

function applyLevelAvatarSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return;
  refs.levelAvatar.dataset.sources = JSON.stringify(sources);
  refs.levelAvatar.dataset.sourceIndex = "0";
  refs.levelAvatar.src = sources[0];
}

function handleLevelAvatarError() {
  let sources = [];
  try {
    sources = JSON.parse(refs.levelAvatar.dataset.sources || "[]");
  } catch (error) {
    sources = [];
  }
  if (!Array.isArray(sources) || sources.length === 0) return;

  const currentIndex = Number(refs.levelAvatar.dataset.sourceIndex || "0");
  const nextIndex = currentIndex + 1;
  if (nextIndex >= sources.length) return;

  refs.levelAvatar.dataset.sourceIndex = String(nextIndex);
  refs.levelAvatar.src = sources[nextIndex];
}

function buildLevelAssetCandidates(level) {
  const candidates = [];
  const levelIndex = Math.max(0, Math.min(9, level - 1));

  // Prefer exact level file (level-0.png ... level-9.png),
  // then gracefully fall back to lower unlocked assets if some files are still missing.
  for (let index = levelIndex; index >= 0; index -= 1) {
    candidates.push(`assets/levels/level-${index}.png`);
    candidates.push(`assets/levels/level-${index}.jpg`);
    candidates.push(`assets/levels/level-${index}.jpeg`);
    candidates.push(`assets/levels/level-${index}.webp`);
    candidates.push(`assets/levels/level-${index}.svg`);
  }
  candidates.push("assets/kat-photo-placeholder.svg");
  return candidates;
}

function getRemainingNewSlotsToday() {
  const today = todayKey();
  let introducedToday = 0;
  for (const entry of Object.values(state.progress)) {
    const progress = normalizeProgressEntry(entry);
    if (progress.introducedDate === today) {
      introducedToday += 1;
    }
  }
  return Math.max(0, NEW_CARDS_PER_DAY - introducedToday);
}

function migrateStoredProgress(rawProgress) {
  if (!rawProgress || typeof rawProgress !== "object") return {};

  const migrated = {};
  for (const [cardId, entry] of Object.entries(rawProgress)) {
    migrated[cardId] = normalizeProgressEntry(entry);
  }
  return migrated;
}

function resolveStoredXp(rawValue, progressMap) {
  if (rawValue && typeof rawValue === "object") {
    if (Object.prototype.hasOwnProperty.call(rawValue, "total")) {
      return normalizeXpValue(rawValue.total);
    }
    if (Object.prototype.hasOwnProperty.call(rawValue, "xp")) {
      return normalizeXpValue(rawValue.xp);
    }
    if (Object.prototype.hasOwnProperty.call(rawValue, "points")) {
      return normalizeXpValue(rawValue.points);
    }
  }
  return deriveXpFromProgress(progressMap);
}

function resolveStoredDailyGoal(rawValue) {
  if (rawValue && typeof rawValue === "object") {
    if (Object.prototype.hasOwnProperty.call(rawValue, "goal")) {
      return normalizeDailyGoal(rawValue.goal);
    }
    if (Object.prototype.hasOwnProperty.call(rawValue, "dailyGoal")) {
      return normalizeDailyGoal(rawValue.dailyGoal);
    }
  }
  return DEFAULT_DAILY_GOAL;
}

function deriveXpFromProgress(progressMap) {
  if (!progressMap || typeof progressMap !== "object") return 0;
  let total = 0;
  for (const entry of Object.values(progressMap)) {
    const normalized = normalizeProgressEntry(entry);
    total += Math.max(0, Number(normalized.correct) || 0);
  }
  return normalizeXpValue(total);
}

function normalizeXpValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
}

function normalizeDailyGoal(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_DAILY_GOAL;
  return Math.max(1, Math.min(MAX_DAILY_GOAL, Math.round(numeric)));
}

function createDefaultProgressEntry() {
  return {
    attempts: 0,
    correct: 0,
    introduced: false,
    introducedDate: "",
    streak: 0,
    lastDate: "",
    lastResult: null,
    diamondSince: ""
  };
}

function normalizeProgressEntry(entry) {
  const base = createDefaultProgressEntry();
  if (!entry || typeof entry !== "object") {
    return base;
  }

  const attempts = Number(entry.attempts) || 0;
  const correct = Number(entry.correct) || 0;
  const introduced = Boolean(entry.introduced) || attempts > 0;
  const lastResult =
    typeof entry.lastResult === "boolean" ? entry.lastResult : base.lastResult;

  let streak = 0;
  if (typeof entry.streak === "number" && Number.isFinite(entry.streak)) {
    streak = Math.max(0, Math.min(7, Math.floor(entry.streak)));
  } else if (introduced && lastResult === true) {
    const oldInterval = Number(entry.interval) || 0;
    if (oldInterval >= 30) streak = 7;
    else if (oldInterval >= 16) streak = 6;
    else if (oldInterval >= 8) streak = 5;
    else if (oldInterval >= 4) streak = 4;
    else if (oldInterval >= 2) streak = 3;
    else if (oldInterval >= 1) streak = 2;
    else streak = 1;
  }

  if (lastResult === false) {
    streak = 0;
  }

  return {
    attempts,
    correct,
    introduced,
    introducedDate:
      typeof entry.introducedDate === "string" && entry.introducedDate ? entry.introducedDate : "",
    streak,
    lastDate: typeof entry.lastDate === "string" ? entry.lastDate : "",
    lastResult,
    diamondSince:
      typeof entry.diamondSince === "string"
        ? entry.diamondSince
        : streak >= 7
          ? todayKey()
          : ""
  };
}

function getProgress(cardId) {
  if (!state.progress[cardId]) {
    state.progress[cardId] = createDefaultProgressEntry();
    return state.progress[cardId];
  }
  state.progress[cardId] = normalizeProgressEntry(state.progress[cardId]);
  return state.progress[cardId];
}

function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    return parsed;
  } catch (error) {
    console.warn("Storage-Lesen fehlgeschlagen", error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Storage-Schreiben fehlgeschlagen", error);
  }
}

function scheduleRemoteSync() {
  if (!supabase || !state.user) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    pushRemoteState();
  }, 800);
}

async function pullRemoteState() {
  if (!supabase || !state.user) return;

  const { data, error } = await supabase
    .from("progress")
    .select("id, status, updated_at")
    .eq("user_id", state.user.id)
    .eq("card_id", APP_STATE_CARD_ID)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    refs.authStatus.textContent = `Cloud-Laden fehlgeschlagen: ${error.message}`;
    return;
  }

  const row = data?.[0] || null;
  if (!row) {
    remoteStateRowId = null;
    if (
      Object.keys(state.progress).length ||
      Object.keys(state.dailyStats).length ||
      normalizeXpValue(state.xp) > 0 ||
      state.dailyGoal !== DEFAULT_DAILY_GOAL
    ) {
      await pushRemoteState();
    }
    return;
  }

  remoteStateRowId = row.id;

  try {
    const payload = JSON.parse(row.status || "{}");
    const migratedProgress = migrateStoredProgress(
      payload && typeof payload.progress === "object" && payload.progress ? payload.progress : {}
    );
    state.progress = migratedProgress;
    state.dailyStats =
      payload && typeof payload.dailyStats === "object" && payload.dailyStats
        ? payload.dailyStats
        : {};
    state.xp = resolveStoredXp(payload, migratedProgress);
    state.dailyGoal = resolveStoredDailyGoal(payload);
    saveToStorage(STORAGE_PROGRESS_KEY, state.progress);
    saveToStorage(STORAGE_DAILY_KEY, state.dailyStats);
    saveToStorage(STORAGE_XP_KEY, { total: state.xp });
    saveToStorage(STORAGE_DAILY_GOAL_KEY, { goal: state.dailyGoal });
    renderFolderFilters();
    rebuildQueue(false);
    renderStats();
    refs.authStatus.textContent = `Eingeloggt als ${state.user.email} (Cloud geladen)`;
  } catch (parseError) {
    refs.authStatus.textContent = "Cloud-Daten konnten nicht gelesen werden.";
    console.error(parseError);
  }
}

async function pushRemoteState() {
  if (!supabase || !state.user) return;

  const payload = JSON.stringify({
    progress: state.progress,
    dailyStats: state.dailyStats,
    xp: normalizeXpValue(state.xp),
    dailyGoal: normalizeDailyGoal(state.dailyGoal)
  });

  if (remoteStateRowId) {
    const { error } = await supabase
      .from("progress")
      .update({ status: payload, updated_at: new Date().toISOString() })
      .eq("id", remoteStateRowId)
      .eq("user_id", state.user.id);
    if (!error) return;
  }

  const { data, error } = await supabase
    .from("progress")
    .insert({
      user_id: state.user.id,
      card_id: APP_STATE_CARD_ID,
      status: payload
    })
    .select("id")
    .single();

  if (error) {
    refs.authStatus.textContent = `Cloud-Speichern fehlgeschlagen: ${error.message}`;
    return;
  }
  remoteStateRowId = data.id;
}

function todayKey() {
  return dateToKey(new Date());
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dayKey, daysToAdd) {
  const date = new Date(`${dayKey}T12:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return dateToKey(date);
}

function getLastDays(count) {
  const days = [];
  const cursor = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - i);
    days.push(dateToKey(date));
  }
  return days;
}

function shortDay(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("de-DE", { weekday: "short" });
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
