// Case 01 — The Missing Researcher (prologue slice).
// This file is the authoritative definition of clues, objectives and contradictions.
// Both the client and the server read it, so it must contain no secrets that
// would spoil the case if shipped to the browser.

import type {
  CharacterDossier,
  ClueDefinition,
  Contradiction,
  ObjectiveDefinition,
} from './types';

export const CASE_ID = 'case01_missing_researcher';
export const CASE_TITLE = 'The Missing Researcher';
export const DISTRICT_ID = 'old_town';

export const CHARACTERS: CharacterDossier[] = [
  {
    id: 'daniel_reed',
    name: 'Daniel Reed',
    role: 'Missing — researcher, Halcyon Institute',
    publicBio:
      'Data-systems researcher, 34. Due to present a "major breakthrough" at the Halcyon Institute on Friday. Lives alone in Unit 1C of the Halvorsen on Calloway Street. Last heard from at 02:13, in a message sent to you.',
  },
  {
    id: 'maya_chen',
    name: 'Maya Chen',
    role: 'Research colleague',
    publicBio:
      'Co-author on most of Daniel’s recent papers at the University Quarter labs. Known for careful, methodical work. Publicly listed as his closest collaborator.',
  },
  {
    id: 'inspector_rao',
    name: 'Inspector Rao',
    role: 'Greyhaven PD — your former ally',
    publicBio:
      'Senior inspector, Greyhaven Police. Worked alongside you on case GH-2021-0305, the case that ended your career. You have not spoken in five years.',
  },
  {
    id: 'elias_moreau',
    name: 'Elias Moreau',
    role: 'Investor',
    publicBio:
      'Founder of Moreau Capital. Principal private backer of Daniel’s research programme at the Halcyon Institute. Frequently photographed at charity galas.',
  },
];

export const CLUES: ClueDefinition[] = [
  {
    id: 'clue_reed_message',
    name: 'Daniel’s Message',
    summary: 'A warning sent to you at 02:13, with a photo from your old case.',
    description:
      '"If you’re reading this, someone has already started rewriting the truth. Don’t trust the evidence. Find the original." Attached: a crime-scene photograph from case GH-2021-0305 (Pell Street warehouse, 5 March 2021), the case that ended your career. You never met Daniel Reed.',
    location: 'alex_phone',
    type: 'message',
    status: 'confirmed',
    reliability: 'verified',
    relatedCharacters: ['daniel_reed'],
    timestamps: [{ time: '02:13', label: 'Daniel’s message reaches your phone' }],
    links: ['clue_handwritten_note', 'clue_laptop_messages'],
    requires: [],
  },
  {
    id: 'clue_smartlock_log',
    name: 'Smart-Lock Log, Unit 1C',
    summary: 'A guest code opened Daniel’s door at 23:31.',
    description:
      'Keypad log for Unit 1C. 21:58: unlocked with the resident code (Daniel). 23:31: unlocked with guest code G-2, issued three days ago, with no name on it. 23:47: locked from the outside keypad. No forced entry.',
    location: 'halvorsen_lobby',
    type: 'digital',
    status: 'confirmed',
    reliability: 'verified',
    relatedCharacters: ['daniel_reed', 'unknown'],
    timestamps: [
      { time: '21:58', label: 'Unit 1C unlocked — resident code (Daniel)' },
      { time: '23:31', label: 'Unit 1C unlocked — guest code G-2 (unnamed)' },
      { time: '23:47', label: 'Unit 1C locked from outside keypad' },
    ],
    links: ['clue_cctv_footage'],
    requires: [],
  },
  {
    id: 'clue_glass_print',
    name: 'Two Whiskey Glasses',
    summary: 'Daniel had company. One glass was rinsed, one was not.',
    description:
      'Two glasses on the coffee table. One has been rinsed and is still beaded with water. The other holds a finger of whiskey and has smudges on the rim.',
    location: 'unit_1c',
    type: 'physical',
    status: 'confirmed',
    reliability: 'unverified',
    relatedCharacters: ['daniel_reed', 'unknown'],
    timestamps: [],
    links: ['clue_smartlock_log'],
    requires: [],
    interpretation: {
      action: 'Dust for prints',
      insight:
        'A clean partial print on the unrinsed glass. It is too small for Daniel’s hands, which you can tell from the prints on his own mug. Someone else drank here and tried to clean up, but only rinsed one glass. A lab match is needed before this proves anything.',
    },
  },
  {
    id: 'clue_handwritten_note',
    name: 'Handwritten Note',
    summary: '"ARCHIVE ≠ ORIGINAL. Ask R. about the 5th of March."',
    description:
      'A page torn from a notebook and tucked under the fruit bowl. In hurried pencil: "ARCHIVE ≠ ORIGINAL. They edited the record, not the event. Ask R. about the 5th of March." It is Daniel’s handwriting, matching the labels on his shelves.',
    location: 'unit_1c',
    type: 'document',
    status: 'confirmed',
    reliability: 'verified',
    relatedCharacters: ['daniel_reed', 'inspector_rao'],
    timestamps: [],
    links: ['clue_reed_message', 'clue_photograph'],
    requires: [],
  },
  {
    id: 'clue_laptop_messages',
    name: 'Daniel’s Laptop',
    summary: 'Storage drive missing. Three messages recovered from the cache.',
    description:
      'The laptop’s storage drive has been removed, and its screws are lined up neatly on the desk. The message cache survived in memory. 21:04, from "Maya": "We need to talk about the numbers before Friday. Not over the phone." 22:15, from an unknown number: "Stop digging into GH-2021-0305. Last warning." 23:09, an unsent draft to Alex Mercer: "They changed the timestamps. The original is..."',
    location: 'unit_1c',
    type: 'digital',
    status: 'confirmed',
    reliability: 'verified',
    relatedCharacters: ['daniel_reed', 'maya_chen', 'unknown'],
    timestamps: [
      { time: '21:04', label: 'Message from Maya: "We need to talk about the numbers"' },
      { time: '22:15', label: 'Unknown number: "Stop digging into GH-2021-0305"' },
      { time: '23:09', label: 'Daniel drafts an unsent message to you' },
    ],
    links: ['clue_reed_message', 'clue_handwritten_note'],
    // The passcode comes from the case number in Daniel's message.
    requires: ['clue_reed_message'],
  },
  {
    id: 'clue_photograph',
    name: 'Gala Photograph',
    summary: 'Daniel, Maya and Elias at the Halcyon spring gala.',
    description:
      'A printed photograph pinned to the corkboard, held by a red pin. Daniel, Maya Chen and Elias Moreau are raising glasses at the Halcyon Institute spring gala. On the back, in Daniel’s hand: "Before."',
    location: 'unit_1c',
    type: 'photograph',
    status: 'confirmed',
    reliability: 'verified',
    relatedCharacters: ['daniel_reed', 'maya_chen', 'elias_moreau'],
    timestamps: [],
    links: ['clue_handwritten_note'],
    requires: [],
    interpretation: {
      action: 'Look closer',
      insight:
        'In the background, half out of focus, Elias Moreau is shaking hands with a man in a grey overcoat: Inspector Rao. Daniel has circled them faintly in pencil. Rao never mentioned knowing Daniel’s backer.',
    },
  },
  {
    id: 'clue_cctv_footage',
    name: 'Lobby CCTV Footage',
    summary: 'Daniel enters at 21:57. A grey-coated figure leaves at 23:46.',
    description:
      'Lobby camera, Halvorsen building. 21:57: Daniel enters with a laptop bag and glances over his shoulder. 23:46: a figure in a long grey coat leaves, face hidden by an umbrella, and turns toward the alley beside Café Noctua. Daniel is never seen leaving.',
    location: 'halvorsen_lobby',
    type: 'footage',
    status: 'confirmed',
    reliability: 'questionable',
    relatedCharacters: ['daniel_reed', 'unknown'],
    timestamps: [
      { time: '21:57', label: 'CCTV: Daniel enters the lobby' },
      { time: '23:46', label: 'CCTV: grey-coated figure leaves toward the alley' },
    ],
    links: ['clue_smartlock_log', 'clue_discarded_phone'],
    requires: [],
    interpretation: {
      action: 'Flag the anomaly',
      insight:
        'The frame counter jumps 1,612 frames between 23:11:58 and 23:39:41. At one frame per second, that is 27 minutes of missing footage. The recording was cut, not paused.',
      timestamps: [{ time: '23:12', label: 'CCTV gap begins (27 minutes missing)' }],
    },
  },
  {
    id: 'clue_discarded_phone',
    name: 'Discarded Burner Phone',
    summary: 'Last call at 23:52 to a contact saved as "E.M."',
    description:
      'A cheap prepaid phone with a cracked screen, dropped behind the dumpster in the alley beside Café Noctua. It has one contact, "E.M.", and one outgoing call at 23:52 lasting 41 seconds. The battery is nearly dead. It is not Daniel’s registered phone.',
    location: 'noctua_alley',
    type: 'physical',
    status: 'confirmed',
    reliability: 'unverified',
    relatedCharacters: ['elias_moreau', 'unknown'],
    timestamps: [{ time: '23:52', label: 'Burner phone calls "E.M." (41 seconds)' }],
    links: ['clue_cctv_footage'],
    requires: [],
  },
];

export const CONTRADICTIONS: Contradiction[] = [
  {
    id: 'contra_gap_entry',
    title: 'Someone came in during the missing footage',
    description:
      'The smart lock shows guest code G-2 opening Unit 1C at 23:31, inside the 27-minute stretch the lobby camera did not record. Whoever used that code knew the footage would be missing.',
    clueIds: ['clue_smartlock_log', 'clue_cctv_footage'],
    requiresInterpreted: ['clue_cctv_footage'],
  },
  {
    id: 'contra_rao_elias',
    title: 'Rao knows Daniel’s backer',
    description:
      'Daniel’s note tells you to "Ask R." about 5 March, the date of your old case. The gala photograph shows Inspector Rao shaking hands with Elias Moreau, the man funding Daniel’s research.',
    clueIds: ['clue_handwritten_note', 'clue_photograph'],
    requiresInterpreted: ['clue_photograph'],
  },
];

/** Flags the client may set. The server rejects anything not listed here. */
export const KNOWN_FLAGS = [
  'prologue_started',
  'entered_building',
  'entered_apartment',
  'door_1c_open',
  'reviewed_contradiction',
  'prologue_complete_seen',
] as const;

export const APARTMENT_CLUES = [
  'clue_smartlock_log',
  'clue_glass_print',
  'clue_handwritten_note',
  'clue_laptop_messages',
  'clue_photograph',
];

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    id: 'obj_enter_building',
    text: 'Get inside the Halvorsen, Daniel’s building across from Café Noctua',
    condition: { type: 'flag', flag: 'entered_building' },
  },
  {
    id: 'obj_search_apartment',
    text: 'Search Unit 1C for anything Daniel left behind',
    hint: 'Find at least 3 pieces of evidence in or around the apartment.',
    condition: { type: 'discovered', ids: APARTMENT_CLUES, min: 3 },
  },
  {
    id: 'obj_check_cctv',
    text: 'Review the lobby security footage and find what doesn’t fit',
    hint: 'The terminal is on the concierge desk.',
    condition: { type: 'interpreted', id: 'clue_cctv_footage' },
  },
  {
    id: 'obj_follow_figure',
    text: 'Follow the grey-coated figure’s route into the alley beside Café Noctua',
    condition: { type: 'discovered', ids: ['clue_discarded_phone'] },
  },
  {
    id: 'obj_review_case',
    text: 'Open the case file [J] and review a contradiction',
    condition: { type: 'flag', flag: 'reviewed_contradiction' },
  },
];
