// Static, fictional reference data for the demo seeder.

export const MALE_FIRST_NAMES = [
  'Jose', 'Juan', 'Antonio', 'Ricardo', 'Eduardo', 'Rogelio', 'Ernesto', 'Romeo',
  'Danilo', 'Rodolfo', 'Fernando', 'Alfredo', 'Manuel', 'Roberto', 'Renato',
  'Teodoro', 'Leonardo', 'Arturo', 'Domingo', 'Felipe', 'Gregorio', 'Mario',
  'Nestor', 'Reynaldo', 'Rolando', 'Samuel', 'Vicente', 'Wilfredo', 'Benjamin',
  'Carlos', 'Dionisio', 'Efren', 'Generoso', 'Isidro', 'Jaime', 'Lorenzo',
  'Marcelino', 'Noel', 'Pablo', 'Raul', 'Santiago', 'Tomas', 'Virgilio',
] as const;

export const FEMALE_FIRST_NAMES = [
  'Maria', 'Rosario', 'Teresita', 'Lourdes', 'Corazon', 'Erlinda', 'Gloria',
  'Leticia', 'Remedios', 'Milagros', 'Natividad', 'Perla', 'Rosalinda',
  'Zenaida', 'Aurora', 'Carmelita', 'Divina', 'Estrella', 'Felicidad',
  'Herminia', 'Imelda', 'Josefina', 'Luzviminda', 'Marilou', 'Nenita',
  'Ofelia', 'Pacita', 'Rebecca', 'Susana', 'Trinidad', 'Victoria', 'Wilma',
  'Adelaida', 'Basilisa', 'Concepcion', 'Dolores', 'Elena', 'Florencia',
] as const;

export const YOUNGER_FIRST_NAMES = [
  'Mark', 'John Paul', 'Kristine', 'Jennifer', 'Michael', 'Angelica', 'Ryan',
  'Joanna', 'Christian', 'Mary Grace', 'Jerome', 'Rachelle', 'Kevin', 'Shiela',
  'Paolo', 'Katherine', 'Arnel', 'Jasmine', 'Dennis', 'Lovely', 'Ronald',
  'Cherry', 'Jayson', 'Princess', 'Rommel', 'Maricel', 'Edwin', 'Rowena',
] as const;

export const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza',
  'Torres', 'Villanueva', 'Ramos', 'Aquino', 'Castillo', 'Rivera', 'Flores',
  'Gonzales', 'Fernandez', 'Lopez', 'Dela Cruz', 'Del Rosario', 'Navarro',
  'Pascual', 'Mercado', 'Aguilar', 'Salazar', 'Domingo', 'Gutierrez',
  'Manalo', 'Soriano', 'Tan', 'Lim', 'Sy', 'Cabrera', 'Dizon', 'Espinosa',
  'Fajardo', 'Ignacio', 'Javier', 'Lacson', 'Macaraeg', 'Natividad', 'Padilla',
  'Quiambao', 'Robles', 'Sarmiento', 'Tolentino', 'Umali', 'Valdez', 'Yap',
  'Zamora', 'Abellana', 'Bacus', 'Cagas', 'Dumaguing', 'Esmeralda', 'Gumapac',
  'Lumapas', 'Maglinte', 'Pacana', 'Sumalinog', 'Tampus', 'Ybanez',
] as const;

export const BARANGAYS = [
  'Buhangin', 'Matina Crossing', 'Toril', 'Bajada', 'Agdao', 'Sasa', 'Talomo',
  'Catalunan Grande', 'Mintal', 'Lanang', 'Panacan', 'Tibungco', 'Bunawan',
  'Calinan', 'Ma-a', 'Langub', 'Cabantian', 'Indangan', 'Bago Aplaya',
  'Ulas', 'Dumoy', 'Tigatto', 'Mandug', 'Communal',
] as const;

export const CITIES = [
  ['Davao City', 70],
  ['Panabo City', 8],
  ['Tagum City', 6],
  ['Digos City', 6],
  ['Island Garden City of Samal', 4],
  ['Sta. Cruz, Davao del Sur', 3],
  ['Carmen, Davao del Norte', 3],
] as const;

export const RELATIONSHIPS = [
  ['Spouse', 25],
  ['Son', 20],
  ['Daughter', 22],
  ['Sibling', 10],
  ['Parent', 6],
  ['Grandchild', 8],
  ['Niece', 3],
  ['Nephew', 3],
  ['In-law', 3],
] as const;

export const LOCATIONS_OF_DEATH = [
  ['Southern Philippines Medical Center', 22],
  ['Davao Doctors Hospital', 14],
  ['San Pedro Hospital', 10],
  ['Brokenshire Memorial Hospital', 8],
  ['Davao Medical School Foundation Hospital', 7],
  ['Ricardo Limso Medical Center', 5],
  ['Metro Davao Medical and Research Center', 5],
  ['Residence', 25],
  ['Dead on arrival', 4],
] as const;

export const CAUSES_BY_TYPE: Record<string, readonly string[]> = {
  Natural: [
    'Cardiopulmonary arrest', 'Acute myocardial infarction',
    'Cerebrovascular accident (stroke)', 'Community-acquired pneumonia',
    'Chronic kidney disease, stage 5', 'Complications of diabetes mellitus',
    'Hypertensive cardiovascular disease', 'Lung cancer', 'Liver cirrhosis',
    'Septic shock', 'Chronic obstructive pulmonary disease',
    'Congestive heart failure', 'Breast cancer', 'Colon cancer',
    'Pulmonary tuberculosis', 'Multiple organ failure',
  ],
  Accident: [
    'Multiple injuries, vehicular accident',
    'Traumatic brain injury, motorcycle accident', 'Drowning',
    'Fall from height', 'Electrocution',
  ],
  Homicide: ['Gunshot wound', 'Multiple stab wounds'],
  Suicide: ['Asphyxia by hanging'],
  Unknown: ['Undetermined, pending autopsy'],
};

export const TYPE_OF_DEATH_WEIGHTS = [
  ['Natural', 86],
  ['Accident', 8],
  ['Homicide', 2],
  ['Suicide', 1],
  ['Unknown', 3],
] as const;

export const PHYSICAL_DESCRIPTIONS = [
  'Slim build, gray hair, approx. 5\'4"',
  'Medium build, black hair, approx. 5\'6"',
  'Heavy build, balding, approx. 5\'7"',
  'Petite, white hair, approx. 4\'11"',
  'Medium build, short gray hair, approx. 5\'2"',
  'Thin build, long black hair, approx. 5\'1"',
  'Stocky build, salt-and-pepper hair, approx. 5\'5"',
] as const;

export const BURIAL_SITES = [
  'Davao Memorial Park, Ma-a',
  'Wireless Public Cemetery, Davao City',
  'Heavenly Gardens Memorial Park, Catalunan Grande',
  'San Pedro Catholic Cemetery, Davao City',
  'Holy Cross Memorial Gardens, Toril',
  'Panabo City Public Cemetery',
  'Tagum Municipal Cemetery',
  'Gardens of Peace Memorial Park, Mintal',
  'Cremation — Davao Crematory, Lanang',
] as const;

// --- Reference rows --------------------------------------------------------

export type PackageType = 'Basic' | 'OG' | 'Metal Casket' | 'High End';

export interface PackageDef {
  packagename: string;
  packagetype: PackageType;
  price: number;
  embalmingperiod: number;
  inclusions: string;
  casket: { caskettype: string; unitcost: number; minimumthreshold: number };
}

const BASE_INCLUSIONS =
  'Embalming, viewing chapel, funeral coach, tarpaulin, guest book, basic floral arrangement';

export const PACKAGES: PackageDef[] = [
  {
    packagename: 'Serenity Basic Package',
    packagetype: 'Basic',
    price: 28000,
    embalmingperiod: 3,
    inclusions: `${BASE_INCLUSIONS}, wooden casket (plain finish)`,
    casket: { caskettype: 'Plain Wooden Casket', unitcost: 9500, minimumthreshold: 3 },
  },
  {
    packagename: 'Comfort Basic Package',
    packagetype: 'Basic',
    price: 35000,
    embalmingperiod: 4,
    inclusions: `${BASE_INCLUSIONS}, wooden casket (varnished), 2 sets of candles, water dispenser`,
    casket: { caskettype: 'Varnished Lauan Casket', unitcost: 12500, minimumthreshold: 3 },
  },
  {
    packagename: 'Heritage OG Package',
    packagetype: 'OG',
    price: 48000,
    embalmingperiod: 5,
    inclusions: `${BASE_INCLUSIONS}, half-glass wooden casket, chapel aircon, 50 chairs, coffee service`,
    casket: { caskettype: 'Half-Glass Narra Casket', unitcost: 17500, minimumthreshold: 2 },
  },
  {
    packagename: 'Tranquil OG Package',
    packagetype: 'OG',
    price: 60000,
    embalmingperiod: 5,
    inclusions: `${BASE_INCLUSIONS}, full-glass wooden casket, chapel aircon, 80 chairs, coffee service, photo frame`,
    casket: { caskettype: 'Full-Glass Narra Casket', unitcost: 22000, minimumthreshold: 2 },
  },
  {
    packagename: 'Silver Metal Package',
    packagetype: 'Metal Casket',
    price: 85000,
    embalmingperiod: 6,
    inclusions: `${BASE_INCLUSIONS}, 18-gauge steel casket, premium chapel, 100 chairs, catering for 50`,
    casket: { caskettype: 'Silver Steel Casket (18-gauge)', unitcost: 33000, minimumthreshold: 2 },
  },
  {
    packagename: 'Bronze Metal Package',
    packagetype: 'Metal Casket',
    price: 110000,
    embalmingperiod: 7,
    inclusions: `${BASE_INCLUSIONS}, bronze-finish steel casket, premium chapel, 120 chairs, catering for 80, live streaming`,
    casket: { caskettype: 'Bronze Finish Steel Casket', unitcost: 44000, minimumthreshold: 2 },
  },
  {
    packagename: 'Eternal High End Package',
    packagetype: 'High End',
    price: 160000,
    embalmingperiod: 7,
    inclusions: `${BASE_INCLUSIONS}, solid mahogany casket, VIP chapel, 150 chairs, full catering, string quartet, live streaming`,
    casket: { caskettype: 'Solid Mahogany Casket', unitcost: 64000, minimumthreshold: 1 },
  },
  {
    packagename: 'Celestial High End Package',
    packagetype: 'High End',
    price: 220000,
    embalmingperiod: 7,
    inclusions: `${BASE_INCLUSIONS}, imported copper casket, VIP chapel suite, 200 chairs, full catering, choir, motorcade, live streaming`,
    casket: { caskettype: 'Imported Copper Casket', unitcost: 92000, minimumthreshold: 1 },
  },
];

export const LIFEPLAN_COMPANIES = [
  { companyname: 'Everlasting Pre-Need Plans Inc.', contactinfo: '(082) 224-5180', minimumthreshold: 50000, prefix: 'EPN' },
  { companyname: 'Golden Haven Memorial Plans', contactinfo: '(082) 297-3341', minimumthreshold: 40000, prefix: 'GHM' },
  { companyname: 'Serenity Life Plans Corp.', contactinfo: '+639178452210', minimumthreshold: 35000, prefix: 'SLP' },
] as const;

export const LGUS = [
  { lguname: 'Davao City CSWDO', contactinfo: '(082) 222-1395' },
  { lguname: 'Panabo City MSWDO', contactinfo: '(084) 628-4062' },
  { lguname: 'Davao del Norte PSWDO', contactinfo: '(084) 216-3285' },
] as const;

export type StaffKey = 'admin' | 'frontdesk' | 'embalmer' | 'director' | 'agent1' | 'agent2';

export interface StaffDef {
  key: StaffKey;
  firstName: string;
  middleName: string;
  lastName: string;
  role: 'admin' | 'user' | 'lifeplan_agent';
  jobRole?: string;
  contactNumber: string;
  /** Index into LIFEPLAN_COMPANIES for agents. */
  company?: number;
  access?: {
    intake_page: boolean;
    case_page: boolean;
    special_case_page: boolean;
    inventory_page: boolean;
    financial_page: boolean;
  };
}

const ALL_ACCESS = {
  intake_page: true,
  case_page: true,
  special_case_page: true,
  inventory_page: true,
  financial_page: true,
};

export const STAFF: StaffDef[] = [
  { key: 'admin', firstName: 'Ramon', middleName: 'Villar', lastName: 'Sarmiento', role: 'admin', jobRole: 'Operations Manager', contactNumber: '+639171234501', access: ALL_ACCESS },
  { key: 'frontdesk', firstName: 'Liza', middleName: 'Ramos', lastName: 'Bautista', role: 'user', jobRole: 'Front Desk Officer', contactNumber: '+639181234502', access: { intake_page: true, case_page: true, special_case_page: true, inventory_page: false, financial_page: true } },
  { key: 'embalmer', firstName: 'Joel', middleName: 'Mendoza', lastName: 'Pacana', role: 'user', jobRole: 'Embalmer', contactNumber: '+639191234503', access: { intake_page: false, case_page: true, special_case_page: false, inventory_page: true, financial_page: false } },
  { key: 'director', firstName: 'Analyn', middleName: 'Torres', lastName: 'Navarro', role: 'user', jobRole: 'Funeral Director', contactNumber: '+639201234504', access: ALL_ACCESS },
  { key: 'agent1', firstName: 'Carlo', middleName: 'Diaz', lastName: 'Espinosa', role: 'lifeplan_agent', contactNumber: '+639211234505', company: 0 },
  { key: 'agent2', firstName: 'Jessa', middleName: 'Lim', lastName: 'Ocampo', role: 'lifeplan_agent', contactNumber: '+639221234506', company: 1 },
];

export const EXPENSES = [
  // [description, min, max, times per month (approx)]
  ['Electricity bill (DLPC)', 14000, 22000, 1],
  ['Water bill (DCWD)', 2200, 3800, 1],
  ['Internet and phone (PLDT)', 2999, 2999, 1],
  ['Fuel for funeral coach', 2500, 5500, 3],
  ['Embalming supplies and chemicals', 3500, 8000, 1],
  ['Fresh flowers and chapel decor', 2500, 6500, 2],
  ['Chapel cleaning and janitorial supplies', 1200, 2800, 1],
  ['Office supplies and printing', 800, 2500, 1],
  ['Funeral coach maintenance', 3500, 12000, 0.35],
  ['Aircon servicing (chapels)', 4500, 9000, 0.3],
  ['Burial and cemetery permit fees', 1500, 4500, 1],
] as const;
