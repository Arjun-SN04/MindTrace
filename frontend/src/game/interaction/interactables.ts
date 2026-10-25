// Every object the player can interact with. World props read their placement
// from here so the interaction point and the visual always line up.

import type { Vec3 } from '@shared';
import { FLOOR_Y } from '../world/layout';

export type Mechanic = 'passcode' | 'interpret' | 'cctv' | 'log';

export interface InteractableDef {
  id: string;
  kind: 'evidence' | 'ambient' | 'door';
  /** Prompt text, e.g. "Examine Laptop". */
  label: string;
  position: Vec3;
  radius?: number;
  clueId?: string;
  /** For doors: the flag that tracks open/closed. */
  doorFlag?: string;
  mechanic?: Mechanic;
  title: string;
  description: string;
  findings?: string[];
}

const F = FLOOR_Y;

export const INTERACTABLES: InteractableDef[] = [
  // ---- Unit 1C ----
  {
    id: 'door_1c',
    kind: 'door',
    label: 'Door',
    position: [-1.0, F + 1.2, 12.0],
    radius: 1.7,
    doorFlag: 'door_1c_open',
    title: 'Unit 1C',
    description: '',
  },
  {
    id: 'smartlock',
    kind: 'evidence',
    label: 'Examine Smart Lock',
    position: [-0.8, F + 1.3, 13.0],
    radius: 1.6,
    clueId: 'clue_smartlock_log',
    mechanic: 'log',
    title: 'Smart-Lock Keypad — Unit 1C',
    description:
      'A brushed-steel keypad beside Daniel’s door. The status light is green. Holding the service key down brings up the last entries in the access log.',
  },
  {
    id: 'glasses',
    kind: 'evidence',
    label: 'Examine Glasses',
    position: [-6.5, F + 0.55, 11.6],
    radius: 1.8,
    clueId: 'clue_glass_print',
    mechanic: 'interpret',
    title: 'Coffee Table',
    description:
      'Two heavy whiskey tumblers on the coffee table. A bottle of mid-shelf rye, a third gone. Nobody pours two glasses for one person.',
    findings: [
      'The left glass has been rinsed and is still beaded with water.',
      'The right glass holds a finger of whiskey and has smudges on the rim.',
    ],
  },
  {
    id: 'note',
    kind: 'evidence',
    label: 'Examine Note',
    position: [-11.3, F + 1.05, 10.6],
    radius: 1.7,
    clueId: 'clue_handwritten_note',
    title: 'Kitchen Counter',
    description:
      'A fruit bowl with two bruised apples. Something is tucked under it on purpose: a page torn from a notebook, folded once.',
    findings: [
      '“ARCHIVE ≠ ORIGINAL. They edited the record, not the event.”',
      '“Ask R. about the 5th of March.”',
      'Hurried pencil. Same hand as the labels on Daniel’s shelves.',
    ],
  },
  {
    id: 'laptop',
    kind: 'evidence',
    label: 'Use Laptop',
    position: [-7.5, F + 0.95, 23.05],
    radius: 1.7,
    clueId: 'clue_laptop_messages',
    mechanic: 'passcode',
    title: 'Daniel’s Laptop',
    description:
      'A battered work laptop, still warm and on mains power. Four tiny screws are lined up next to it. Someone opened the case.',
  },
  {
    id: 'photo',
    kind: 'evidence',
    label: 'Examine Photograph',
    position: [-11.5, F + 1.6, 20.2],
    radius: 1.8,
    clueId: 'clue_photograph',
    mechanic: 'interpret',
    title: 'Corkboard',
    description:
      'Daniel’s corkboard: conference badges, printed graphs, and red string running between index cards whose writing has been scratched out. One photograph is held by a red pin.',
    findings: [
      'Daniel, Maya Chen and Elias Moreau raise glasses at the Halcyon Institute spring gala.',
      'On the back, in Daniel’s hand: “Before.”',
    ],
  },
  {
    id: 'fridge',
    kind: 'ambient',
    label: 'Examine Fridge',
    position: [-10.9, F + 1.2, 14.6],
    title: 'Fridge',
    description: 'Oat milk, takeaway noodles, three energy drinks. The diet of someone working late against a deadline.',
    findings: ['Nothing of note.'],
  },
  {
    id: 'bookshelf',
    kind: 'ambient',
    label: 'Examine Bookshelf',
    position: [-9.2, F + 1.2, 16.4],
    title: 'Bookshelf',
    description:
      'Information theory, forensic accounting, a dog-eared paperback on memory and testimony. Every shelf has a neat handwritten label.',
    findings: ['Daniel labels everything. You will know his handwriting when you see it again.'],
  },
  {
    id: 'window_1c',
    kind: 'ambient',
    label: 'Look Out Window',
    position: [-7, F + 1.6, 8.6],
    radius: 1.6,
    title: 'Window',
    description:
      'Rain runs down the glass. Across Calloway Street, Café Noctua’s sign stains the puddles red. Just past it, the dark mouth of an alley.',
    findings: ['From here, Daniel could see everyone who came and went from the café.'],
  },
  {
    id: 'whiteboard',
    kind: 'ambient',
    label: 'Examine Whiteboard',
    position: [-1.3, F + 1.6, 20.5],
    title: 'Whiteboard',
    description:
      'Wiped clean in a hurry. In the corner, the ghost of one word survived the eraser: ORIGINAL.',
    findings: ['Whoever wiped it was thorough everywhere except the corner.'],
  },
  {
    id: 'cabinet',
    kind: 'ambient',
    label: 'Examine Filing Cabinet',
    position: [-10.95, F + 1.45, 22.45],
    title: 'Filing Cabinet',
    description: 'Every drawer hangs open, and every folder is empty. The dust lines show the drawers were full until recently.',
    findings: ['Someone took paper records too, not only the laptop drive.'],
  },

  // ---- Lobby ----
  {
    id: 'cctv',
    kind: 'evidence',
    label: 'Use Security Terminal',
    position: [6.5, F + 1.35, 11.35],
    radius: 1.8,
    clueId: 'clue_cctv_footage',
    mechanic: 'cctv',
    title: 'Lobby Security Terminal',
    description:
      'The concierge desk is unstaffed overnight. Its security terminal is still logged in to the lobby camera archive.',
  },
  {
    id: 'mailboxes',
    kind: 'ambient',
    label: 'Examine Mailboxes',
    position: [9.5, F + 1.4, 11.5],
    title: 'Mailboxes',
    description: 'Brass slots with typed name cards. REED, D. — 1C. Empty.',
    findings: ['Nothing of note.'],
  },
  {
    id: 'elevator',
    kind: 'ambient',
    label: 'Call Elevator',
    position: [3, F + 1.3, 14.6],
    title: 'Elevator',
    description: 'A handwritten sign is taped over the call button: OUT OF SERVICE — UPPER FLOORS CLOSED FOR RENOVATION.',
    findings: ['The upper floors are closed for now.'],
  },

  // ---- Street ----
  {
    id: 'cafe_door',
    kind: 'ambient',
    label: 'Try Café Door',
    position: [-1.3, 1.3, -7.6],
    title: 'Café Noctua',
    description: 'Locked. A card hangs in the glass: “Back at 6. Coffee is a promise, not a guarantee.”',
    findings: ['The owner will be here in the morning.'],
  },
  {
    id: 'cafe_menu',
    kind: 'ambient',
    label: 'Read Menu',
    position: [-7, 1.0, -6.0],
    title: 'Rain-soaked Menu',
    description: 'A laminated menu clipped to an outdoor table. Flat white, cardamom bun, “the Night Shift” (a triple espresso).',
    findings: ['Nothing of note.'],
  },
  {
    id: 'dumpster',
    kind: 'ambient',
    label: 'Search Dumpster',
    position: [4.65, 1.3, -18.5],
    radius: 1.7,
    title: 'Dumpster',
    description: 'Coffee grounds, cardboard, the sour smell of wet bread. The lid has been pushed back recently, and the rust is smeared.',
    findings: ['Nothing inside, but something glints on the ground beside it.'],
  },
  {
    id: 'burner_phone',
    kind: 'evidence',
    label: 'Pick Up Phone',
    position: [5.2, 0.45, -20.1],
    radius: 1.8,
    clueId: 'clue_discarded_phone',
    title: 'Discarded Phone',
    description:
      'A cheap prepaid handset face-down in a puddle behind the dumpster. Its screen is cracked, but it lights up when you lift it.',
    findings: [
      'One saved contact: “E.M.”',
      'One outgoing call, 23:52, lasting 41 seconds.',
      'It is not Daniel’s registered number.',
    ],
  },
  {
    id: 'sedan',
    kind: 'ambient',
    label: 'Examine Covered Car',
    position: [-18, 1.0, 3.4],
    radius: 2.2,
    title: 'Covered Car',
    description: 'A sedan under a rain-heavy tarp. Someone has tucked a parking permit under the wiper: MERIDIAN SECURITY — STAFF.',
    findings: ['Meridian runs private security for half of Downtown. Odd to see one parked out here.'],
  },
  {
    id: 'newsbox',
    kind: 'ambient',
    label: 'Read Newspaper',
    position: [-0.6, 1.0, 6.9],
    title: 'Greyhaven Ledger — Evening Edition',
    description:
      '“HALCYON INSTITUTE TO UNVEIL ‘MAJOR BREAKTHROUGH’ FRIDAY.” Below the fold, Elias Moreau smiles beside a ribbon-cutting.',
    findings: ['Daniel’s announcement was meant to be front-page news.'],
  },
  {
    id: 'busstop',
    kind: 'ambient',
    label: 'Read Poster',
    position: [-26, 1.4, -6.4],
    radius: 2.0,
    title: 'Bus Shelter Poster',
    description: '“Meridian Security: Because the truth needs protecting.” Someone has scratched out “protecting” and written “editing”.',
    findings: ['Nothing of note.'],
  },
  {
    id: 'barricade',
    kind: 'ambient',
    label: 'Read Notice',
    position: [44, 1.2, 0],
    radius: 3.2,
    title: 'Police Barricade',
    description:
      'HARBOR BRIDGE CLOSED FOR STRUCTURAL INSPECTION. The road to the Harbor District is sealed off with police tape until further notice.',
    findings: ['The Harbor District will have to wait. There is work to do here first.'],
  },
];

const byId = new Map(INTERACTABLES.map((i) => [i.id, i]));

export function getInteractable(id: string): InteractableDef | undefined {
  return byId.get(id);
}

export function ipos(id: string): Vec3 {
  const def = byId.get(id);
  if (!def) throw new Error(`Unknown interactable ${id}`);
  return def.position;
}
