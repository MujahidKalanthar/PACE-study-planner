import { ChapterDifficulty } from '../types';

export interface PresetSubjectData {
  id: string;
  name: string;
  color: string;
  chapters: {
    name: string;
    classLevel?: 11 | 12 | 'common';
    difficulty: ChapterDifficulty;
    estimatedMinutes: number;
    subtopics: string[];
  }[];
}

export interface PresetCourse {
  key: string;
  title: string;
  subtitle: string;
  examCategory?: string;
  subjects: PresetSubjectData[];
}

export const PRESET_COURSES: PresetCourse[] = [
  {
    key: 'jee_pcm',
    title: 'JEE Main & Advanced (PCM)',
    subtitle: 'Physics, Chemistry & Mathematics for Engineering Aspirants',
    subjects: [
      {
        id: 'sub_phy',
        name: 'Physics',
        color: '#3B82F6', // Blue
        chapters: [
          { name: 'Units & Measurements', classLevel: 11, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['SI Units', 'Dimensional Analysis', 'Errors in Measurement'] },
          { name: 'Kinematics (Motion in 1D & 2D)', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Displacement & Velocity', 'Projectile Motion', 'Relative Velocity'] },
          { name: 'Laws of Motion', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Newton’s Laws', 'Friction', 'Circular Motion dynamics'] },
          { name: 'Work, Energy & Power', classLevel: 11, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Work-Energy Theorem', 'Conservation of Energy', 'Collisions'] },
          { name: 'Rotational Motion & Torque', classLevel: 11, difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Center of Mass', 'Moment of Inertia', 'Angular Momentum'] },
          { name: 'Gravitation', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Kepler’s Laws', 'Gravitational Potential', 'Escape Velocity'] },
          { name: 'Thermodynamics & Kinetic Theory', classLevel: 11, difficulty: 'medium', estimatedMinutes: 50, subtopics: ['First & Second Laws', 'Carnot Engine', 'Ideal Gas Equation'] },
          { name: 'Oscillations & Waves', classLevel: 11, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Simple Harmonic Motion', 'Wave Equation', 'Doppler Effect'] },
          { name: 'Electrostatics & Gauss’s Law', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Coulomb’s Law', 'Electric Field & Potential', 'Capacitors'] },
          { name: 'Current Electricity', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Ohm’s Law & Kirchhoff’s Rules', 'Potentiometer', 'Heating Effects'] },
          { name: 'Magnetic Effects of Current & Magnetism', classLevel: 12, difficulty: 'medium', estimatedMinutes: 50, subtopics: ['Biot-Savart Law', 'Ampere’s Circuital Law', 'Magnetic Dipoles'] },
          { name: 'Electromagnetic Induction & AC', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Faraday’s Law', 'Lenz’s Law', 'LCR Circuits & Resonance'] },
          { name: 'Optics (Ray & Wave Optics)', classLevel: 12, difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Total Internal Reflection', 'Lenses & Mirrors', 'Interference & Diffraction'] },
          { name: 'Modern Physics & Semiconductors', classLevel: 12, difficulty: 'easy', estimatedMinutes: 40, subtopics: ['Photoelectric Effect', 'Bohr Model', 'p-n Junction Diodes'] },
        ]
      },
      {
        id: 'sub_chem',
        name: 'Chemistry',
        color: '#10B981', // Emerald
        chapters: [
          { name: 'Some Basic Concepts of Chemistry', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Mole Concept', 'Stoichiometry', 'Molarity & Molality'] },
          { name: 'Structure of Atom', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Quantum Numbers', 'Photoelectric Effect', 'Aufbau Principle'] },
          { name: 'Periodic Table & Periodicity', classLevel: 11, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Ionization Enthalpy', 'Electronegativity', 'Atomic Radii Trends'] },
          { name: 'Chemical Bonding & Molecular Structure', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['VSEPR Theory', 'Hybridization', 'Molecular Orbital Theory'] },
          { name: 'Thermodynamics & Energetics', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Enthalpy & Entropy', 'Gibbs Free Energy', 'Spontaneity'] },
          { name: 'Chemical & Ionic Equilibrium', classLevel: 11, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Le Chatelier’s Principle', 'pH Calculations', 'Solubility Product'] },
          { name: 'Redox Reactions & Electrochemistry', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Nernst Equation', 'Electrochemical Cells', 'Faraday’s Laws'] },
          { name: 'Solutions & Colligative Properties', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Raoult’s Law', 'Osmotic Pressure', 'van ’t Hoff factor'] },
          { name: 'Chemical Kinetics', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Rate Law & Order of Reaction', 'Arrhenius Equation', 'Half Life'] },
          { name: 'p-Block & d-Block Elements', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Transition Metal Trends', 'Coordination Complexes', 'Oxides & Halides'] },
          { name: 'Organic Chemistry: GOC & Hydrocarbons', classLevel: 11, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Inductive & Resonance Effects', 'Electrophiles & Nucleophiles', 'Alkenes & Alkynes'] },
          { name: 'Aldehydes, Ketones & Carboxylic Acids', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Nucleophilic Addition', 'Aldol Condensation', 'Cannizzaro Reaction'] },
        ]
      },
      {
        id: 'sub_math',
        name: 'Mathematics',
        color: '#8B5CF6', // Purple
        chapters: [
          { name: 'Sets, Relations & Functions', classLevel: 11, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Domain & Range', 'Types of Relations', 'Composite Functions'] },
          { name: 'Quadratic Equations & Complex Numbers', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Nature of Roots', 'Modulus & Argument', 'De Moivre’s Theorem'] },
          { name: 'Sequences & Series', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['AP & GP', 'Sum to n terms', 'Special Series'] },
          { name: 'Permutations & Combinations', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Fundamental Counting Principle', 'Circular Permutations', 'Division into Groups'] },
          { name: 'Binomial Theorem', classLevel: 11, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['General Term', 'Middle Term', 'Properties of Coefficients'] },
          { name: 'Trigonometric Functions & Equations', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Compound Angles', 'Multiple & Submultiple Angles', 'General Solutions'] },
          { name: 'Coordinate Geometry: Straight Lines & Circles', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Slope & Intercepts', 'Distance of a Point', 'Standard Circle Equations'] },
          { name: 'Conic Sections (Parabola, Ellipse, Hyperbola)', classLevel: 11, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Focus & Directrix', 'Tangents & Normals', 'Eccentricity'] },
          { name: 'Matrices & Determinants', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Matrix Operations', 'Inverse & Adjoint', 'Cramer’s Rule'] },
          { name: 'Limits, Continuity & Differentiability', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['L’Hopital’s Rule', 'Chain Rule', 'Continuity Checks'] },
          { name: 'Application of Derivatives (AOD)', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Monotonicity', 'Maxima & Minima', 'Tangents & Normals'] },
          { name: 'Indefinite & Definite Integrals', classLevel: 12, difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Integration by Parts', 'Substitution', 'Properties of Definite Integrals'] },
          { name: 'Differential Equations', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Variable Separable', 'Homogeneous Equations', 'Linear Differential Equations'] },
          { name: 'Vectors & 3D Geometry', classLevel: 12, difficulty: 'medium', estimatedMinutes: 50, subtopics: ['Dot & Cross Product', 'Equation of a Line', 'Shortest Distance'] },
          { name: 'Probability & Bayes Theorem', classLevel: 12, difficulty: 'hard', estimatedMinutes: 45, subtopics: ['Conditional Probability', 'Independent Events', 'Bayes’ Theorem'] },
        ]
      }
    ]
  },
  {
    key: 'neet_pcb',
    title: 'NEET UG (Medical PCB)',
    subtitle: 'Physics, Chemistry & Biology for Medical Entrance',
    subjects: [
      {
        id: 'sub_bio',
        name: 'Biology',
        color: '#EC4899', // Pink
        chapters: [
          { name: 'The Living World & Biological Classification', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Taxonomic Categories', 'Five Kingdom System', 'Monera & Protista'] },
          { name: 'Plant Kingdom & Animal Kingdom', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Algae, Bryophytes, Pteridophytes', 'Non-chordates & Chordates'] },
          { name: 'Morphology & Anatomy of Flowering Plants', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Root, Stem, Leaf Modifications', 'Complex Tissues', 'Secondary Growth'] },
          { name: 'Cell: The Unit of Life & Cell Cycle', classLevel: 11, difficulty: 'easy', estimatedMinutes: 40, subtopics: ['Cell Organelles', 'Mitosis & Meiosis phases'] },
          { name: 'Plant Physiology: Photosynthesis & Respiration', classLevel: 11, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Light & Dark Reactions', 'Krebs Cycle', 'Electron Transport Chain'] },
          { name: 'Human Physiology: Circulation & Excretion', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Heart & Cardiac Cycle', 'Nephron & Urine Formation'] },
          { name: 'Human Reproduction & Reproductive Health', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Gametogenesis', 'Menstrual Cycle', 'Contraceptive Methods'] },
          { name: 'Principles of Inheritance & Variation (Genetics)', classLevel: 12, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Mendel’s Laws', 'Sex Determination', 'Genetic Disorders'] },
          { name: 'Molecular Basis of Inheritance', classLevel: 12, difficulty: 'hard', estimatedMinutes: 60, subtopics: ['DNA Replication', 'Transcription & Translation', 'Lac Operon'] },
          { name: 'Biotechnology: Principles and Applications', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Recombinant DNA Technology', 'PCR & Electrophoresis', 'Bt Cotton & Gene Therapy'] },
          { name: 'Ecology & Environment', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Population Interactions', 'Ecosystem Pyramids', 'Biodiversity Conservation'] }
        ]
      },
      {
        id: 'sub_phy_neet',
        name: 'Physics',
        color: '#3B82F6',
        chapters: [
          { name: 'Units & Measurements', classLevel: 11, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Dimensional Formulae', 'Error Analysis'] },
          { name: 'Kinematics', classLevel: 11, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Motion in a Straight Line', 'Projectile Motion'] },
          { name: 'Laws of Motion & Friction', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Newton’s Laws', 'Pulleys & Inclines'] },
          { name: 'Work, Energy & Power', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Kinetic & Potential Energy', 'Power Calculations'] },
          { name: 'Thermodynamics & Heat Transfer', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Conduction & Radiation', 'Specific Heat'] },
          { name: 'Current Electricity', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Resistors in Series/Parallel', 'Ohm’s Law'] },
          { name: 'Ray Optics & Optical Instruments', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Microscopes & Telescopes', 'Refraction'] },
          { name: 'Dual Nature of Matter & Atoms', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['De Broglie Wavelength', 'Bohr Radii'] }
        ]
      },
      {
        id: 'sub_chem_neet',
        name: 'Chemistry',
        color: '#10B981',
        chapters: [
          { name: 'Basic Principles of Chemistry (Mole Concept)', classLevel: 11, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Mole & Equivalent Weight', 'Empirical Formula'] },
          { name: 'Chemical Bonding & Hybridization', classLevel: 11, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Dipole Moment', 'Hybridization'] },
          { name: 'Equilibrium (Chemical & Ionic)', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Buffer Solutions', 'Common Ion Effect'] },
          { name: 'Coordination Compounds', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['IUPAC Naming', 'Crystal Field Theory'] },
          { name: 'Biomolecules & Polymers', classLevel: 12, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Carbohydrates', 'Proteins', 'DNA vs RNA'] },
          { name: 'Hydrocarbons & GOC', classLevel: 11, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Electrophilic Addition', 'Aromaticity'] }
        ]
      }
    ]
  },
  {
    key: 'cbse_boards',
    title: 'Class 12 Boards (Science)',
    subtitle: 'Physics, Chemistry & Mathematics Board Core Syllabus',
    subjects: [
      {
        id: 'sub_cbse_phy',
        name: 'Physics',
        color: '#3B82F6',
        chapters: [
          { name: 'Electrostatics & Electric Charges', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Electric Flux', 'Derivations of Dipole', 'Capacitance'] },
          { name: 'Current Electricity', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Wheatstone Bridge', 'Internal Resistance', 'Kirchhoff’s Rules'] },
          { name: 'Moving Charges & Magnetism', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Torque on Current Loop', 'Moving Coil Galvanometer'] },
          { name: 'Electromagnetic Induction & Alternating Currents', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Transformer Derivations', 'AC Generator', 'LCR Series'] },
          { name: 'Electromagnetic Waves', classLevel: 12, difficulty: 'easy', estimatedMinutes: 25, subtopics: ['Displacement Current', 'EM Spectrum uses'] },
          { name: 'Ray Optics & Wave Optics', classLevel: 12, difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Lens Maker’s Formula', 'Huygens’ Principle', 'Young’s Double Slit'] },
          { name: 'Dual Nature of Radiation and Matter', classLevel: 12, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Einstein’s Photoelectric Equation', 'Experimental graphs'] },
          { name: 'Atoms & Nuclei', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Bohr Postulates', 'Nuclear Fission & Fusion'] },
          { name: 'Semiconductor Electronics', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Rectifiers', 'Energy bands', 'Intrinsic & Extrinsic semiconductors'] }
        ]
      },
      {
        id: 'sub_cbse_chem',
        name: 'Chemistry',
        color: '#10B981',
        chapters: [
          { name: 'Solutions', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Henry’s Law', 'Abnormal Molecular Masses'] },
          { name: 'Electrochemistry', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Kohlrausch’s Law', 'Fuel Cells & Corrosion'] },
          { name: 'Chemical Kinetics', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Pseudo First Order', 'Activation Energy'] },
          { name: 'd and f Block Elements', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Lanthanoid Contraction', 'KMnO4 & K2Cr2O7 reactions'] },
          { name: 'Coordination Compounds', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Valence Bond Theory', 'Isomerism'] },
          { name: 'Haloalkanes & Haloarenes', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['SN1 & SN2 Mechanisms', 'Optical Rotation'] },
          { name: 'Alcohols, Phenols & Ethers', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Kolbe & Reimer-Tiemann reactions', 'Williamson Synthesis'] },
          { name: 'Aldehydes, Ketones & Carboxylic Acids', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Name Reactions', 'Tests to distinguish'] },
          { name: 'Amines', classLevel: 12, difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Hoffmann Bromamide', 'Hinsberg Test'] },
          { name: 'Biomolecules', classLevel: 12, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Denaturation of proteins', 'Vitamins & Nucleic acids'] }
        ]
      },
      {
        id: 'sub_cbse_math',
        name: 'Mathematics',
        color: '#8B5CF6',
        chapters: [
          { name: 'Relations and Functions', classLevel: 12, difficulty: 'medium', estimatedMinutes: 35, subtopics: ['Equivalence Relations', 'One-one & Onto Functions'] },
          { name: 'Inverse Trigonometric Functions', classLevel: 12, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Principal Value Branches'] },
          { name: 'Matrices and Determinants', classLevel: 12, difficulty: 'easy', estimatedMinutes: 40, subtopics: ['Matrix Inverses', 'Consistency of Equations'] },
          { name: 'Continuity & Differentiability', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Logarithmic Differentiation', 'Parametric Forms'] },
          { name: 'Applications of Derivatives', classLevel: 12, difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Increasing/Decreasing Functions', 'Word problems on Maxima/Minima'] },
          { name: 'Integrals', classLevel: 12, difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Partial Fractions', 'Definite Integral Properties'] },
          { name: 'Applications of the Integrals (Area)', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Area between curves'] },
          { name: 'Differential Equations', classLevel: 12, difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Integrating Factor', 'General & Particular Solutions'] },
          { name: 'Vectors and Three-Dimensional Geometry', classLevel: 12, difficulty: 'medium', estimatedMinutes: 50, subtopics: ['Direction Cosines', 'Coplanarity of Lines'] },
          { name: 'Linear Programming', classLevel: 12, difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Graphical method', 'Corner point method'] },
          { name: 'Probability', classLevel: 12, difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Bayes’ Rule', 'Random Variables'] }
        ]
      }
    ]
  },
  {
    key: 'gate_cs',
    title: 'Computer Science & GATE Core',
    subtitle: 'Data Structures, Algorithms, OS, DBMS & Computer Networks',
    subjects: [
      {
        id: 'sub_dsa',
        name: 'Data Structures & Algorithms',
        color: '#06B6D4', // Cyan
        chapters: [
          { name: 'Arrays, Linked Lists, Stacks & Queues', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Two Pointers', 'Stack Monotonicity', 'Queue BFS'] },
          { name: 'Trees, Binary Search Trees & Heaps', difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Tree Traversals', 'BST Operations', 'Priority Queues'] },
          { name: 'Graph Algorithms', difficulty: 'hard', estimatedMinutes: 60, subtopics: ['BFS & DFS', 'Dijkstra Shortest Path', 'Topological Sort'] },
          { name: 'Dynamic Programming & Greedy Approaches', difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Memoization vs Tabulation', 'Knapsack Pattern', 'Interval Scheduling'] },
          { name: 'Asymptotic Analysis & Recurrences', difficulty: 'easy', estimatedMinutes: 30, subtopics: ['Big-O Notation', 'Master Theorem'] },
        ]
      },
      {
        id: 'sub_systems',
        name: 'Operating Systems & DBMS',
        color: '#F59E0B', // Amber
        chapters: [
          { name: 'Process Management & CPU Scheduling', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Round Robin & Priority', 'Context Switching', 'Process States'] },
          { name: 'Process Synchronization & Deadlocks', difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Semaphores & Mutex', 'Banker’s Algorithm', 'Dining Philosophers'] },
          { name: 'Memory Management & Virtual Memory', difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Paging & Segmentation', 'Page Replacement Algorithms', 'TLB'] },
          { name: 'Relational Model & SQL', difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Joins & Subqueries', 'Relational Algebra', 'Integrity Constraints'] },
          { name: 'Normalization & Transactions (ACID)', difficulty: 'hard', estimatedMinutes: 50, subtopics: ['1NF to BCNF', 'Serializability', 'Concurrency Control'] },
        ]
      },
      {
        id: 'sub_networks',
        name: 'Computer Networks',
        color: '#8B5CF6',
        chapters: [
          { name: 'OSI & TCP/IP Layer Architecture', difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Protocol Layers', 'Encapsulation', 'Framing'] },
          { name: 'Data Link & Flow/Error Control', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Sliding Window Protocol', 'CRC & Hamming Code', 'CSMA/CD'] },
          { name: 'Network Layer: IP Addressing & Routing', difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Subnetting & CIDR', 'Distance Vector & Link State', 'NAT'] },
          { name: 'Transport Layer: TCP vs UDP & Congestion', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Three-way Handshake', 'Congestion Control', 'Flow Control'] },
        ]
      }
    ]
  },
  {
    key: 'commerce_core',
    title: 'Commerce & Economics Core',
    subtitle: 'Accountancy, Business Studies & Economics',
    subjects: [
      {
        id: 'sub_accounts',
        name: 'Accountancy',
        color: '#10B981',
        chapters: [
          { name: 'Accounting for Partnership Firms', difficulty: 'hard', estimatedMinutes: 55, subtopics: ['Profit & Loss Appropriation', 'Goodwill Valuation', 'Admission of Partner'] },
          { name: 'Company Accounts: Issue of Shares & Debentures', difficulty: 'hard', estimatedMinutes: 60, subtopics: ['Pro-rata Allotment', 'Forfeiture & Reissue', 'Debenture Redemption'] },
          { name: 'Financial Statement Analysis & Cash Flow', difficulty: 'medium', estimatedMinutes: 50, subtopics: ['Ratio Analysis', 'Operating, Investing & Financing Activities'] },
        ]
      },
      {
        id: 'sub_economics',
        name: 'Economics',
        color: '#3B82F6',
        chapters: [
          { name: 'Macroeconomics: National Income & Money Supply', difficulty: 'hard', estimatedMinutes: 50, subtopics: ['GDP / GNP Calculations', 'Central Bank & Money Multiplier'] },
          { name: 'Determination of Income and Employment', difficulty: 'hard', estimatedMinutes: 50, subtopics: ['Aggregate Demand & Supply', 'Investment Multiplier', 'Deficient Demand'] },
          { name: 'Government Budget and Balance of Payments', difficulty: 'medium', estimatedMinutes: 40, subtopics: ['Revenue vs Capital Receipts', 'Foreign Exchange Rates', 'BOP Accounts'] },
        ]
      },
      {
        id: 'sub_business',
        name: 'Business Studies',
        color: '#F59E0B',
        chapters: [
          { name: 'Principles & Functions of Management', difficulty: 'easy', estimatedMinutes: 35, subtopics: ['Taylor & Fayol Principles', 'Planning & Organising'] },
          { name: 'Financial Management & Financial Markets', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Capital Structure', 'Working Capital', 'Money & Capital Market'] },
          { name: 'Marketing Management & Consumer Protection', difficulty: 'easy', estimatedMinutes: 35, subtopics: ['4 Ps of Marketing', 'Consumer Rights & Redressal'] },
        ]
      }
    ]
  }
];
