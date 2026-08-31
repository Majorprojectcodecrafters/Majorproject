const prisma = require('../config/prisma');

/**
 * Authoritative Maharashtra State Board (MSB) 11th & 12th Science Curriculum Topic Mapping Matrix
 */
const MSB_CURRICULUM_TOPIC_MATRIX = {
  // ==================== PHYSICS ====================
  Physics: {
    'Rotational Dynamics': [
      'Characteristics of Circular Motion',
      'Centripetal & Centrifugal Forces',
      'Applications of Circular Motion (Vehicle on Banked Road, Conical Pendulum)',
      'Vertical Circular Motion',
      'Moment of Inertia & Radius of Gyration',
      'Theorem of Parallel Axes & Theorem of Perpendicular Axes',
      'Angular Momentum & Conservation of Angular Momentum',
      'Rolling Motion (Kinetic Energy of Rolling Body)'
    ],
    'Mechanical Properties of Fluids': [
      'Pressure in a Fluid & Pascal Law',
      'Gauge Pressure & Absolute Pressure',
      'Surface Tension & Surface Energy',
      'Angle of Contact & Capillarity',
      'Excess Pressure inside a Liquid Drop & Soap Bubble',
      'Viscosity & Coefficient of Viscosity',
      'Terminal Velocity & Stokes Law',
      'Bernoulli Equation & Applications (Venturimeter)'
    ],
    'Kinetic Theory of Gases and Radiation': [
      'Behavior of Gas & Ideal Gas Equation',
      'Mean Free Path & Pressure of Ideal Gas',
      'RMS Velocity & Root Mean Square Speed',
      'Law of Equipartition of Energy & Specific Heat Capacities',
      'Absorption, Reflection & Transmission of Heat Radiation',
      'Emissive Power & Emissivity of a Body',
      'Ferry Blackbody & Kirchhoff Law of Radiation',
      'Wien Displacement Law & Stefan-Boltzmann Law'
    ],
    'Thermodynamics': [
      'Thermal Equilibrium & Zeroth Law of Thermodynamics',
      'Internal Energy & First Law of Thermodynamics',
      'Thermodynamic State Variables & Equation of State',
      'Thermodynamic Processes (Isothermal, Isobaric, Isochoric, Adiabatic)',
      'Work Done in Thermodynamic Processes & PV Diagrams',
      'Reversible & Irreversible Processes',
      'Heat Engines, Refrigerators & Heat Pumps',
      'Second Law of Thermodynamics & Carnot Engine / Efficiency'
    ],
    'Oscillations': [
      'Simple Harmonic Motion (SHM) & Differential Equation of SHM',
      'Linear SHM & Velocity, Acceleration, Displacement Equations',
      'Composition of Two Linear SHMs of Same Period',
      'Energy of a Particle Performing SHM (Kinetic, Potential, Total)',
      'Simple Pendulum & Laws of Simple Pendulum',
      'Angular SHM & Magnet Oscillating in Uniform Magnetic Field',
      'Damped Oscillations & Free/Forced Oscillations',
      'Resonance & Sharpness of Resonance'
    ],
    'Superposition of Waves': [
      'Progressive Waves & Reflection of Transverse/Longitudinal Waves',
      'Superposition Principle of Waves',
      'Stationary Waves on a Stretched String & Nodes/Antinodes',
      'Modes of Vibration of Stretched String & Laws of Vibrating Strings',
      'Vibrations of Air Columns (End Corrections, Open & Closed Pipes)',
      'Beats & Production/Applications of Beats',
      'Sonometer & Resonance Tube Experiments',
      'Characteristics of Musical Sound & Acoustics'
    ],
    'Wave Optics': [
      'Huygens Principle & Wavefront Concept',
      'Reflection & Refraction of Light using Wave Theory',
      'Interference of Light & Young Double Slit Experiment',
      'Conditions for Steady Interference Pattern & Fringe Width',
      'Diffraction of Light & Single Slit Diffraction Pattern',
      'Resolving Power of Microscope & Telescope (Rayleigh Criterion)',
      'Polarization of Light & Brewster Law',
      'Polaroids & Law of Malus'
    ],
    'Electrostatics': [
      'Gauss Law & Applications (Spherical Shell, Cylinder, Infinite Sheet)',
      'Electric Potential & Potential Difference',
      'Electric Potential due to an Electric Dipole & System of Charges',
      'Equipotential Surfaces',
      'Potential Energy of a Dipole in External Magnetic/Electric Field',
      'Conductors & Insulators, Dielectrics & Polarization',
      'Capacitors & Capacitance (Parallel Plate Capacitor)',
      'Combinations of Capacitors in Series and Parallel & Energy Stored'
    ],
    'Current Electricity': [
      'Kirchhoff First & Second Laws of Electrical Circuits',
      'Wheatstone Bridge & Metre Bridge Circuit',
      'Potentiometer Principle & Applications (Comparing EMFs, Internal Resistance)',
      'Galvanometer as an Ammeter & Voltmeter (Shunt Resistor Calculation)',
      'Thermoelectricity & Seebeck, Peltier, Thomson Effects'
    ],
    'Magnetic Fields due to Electric Current': [
      'Biot-Savart Law & Magnetic Field due to Straight Wire / Circular Loop',
      'Ampere Law & Applications (Solenoid, Toroid)',
      'Force on a Moving Charge in Magnetic Field (Lorentz Force)',
      'Cyclotron Principle & Construction/Working',
      'Force between Two Parallel Current-Carrying Conductors',
      'Torque on a Current Loop in Uniform Magnetic Field',
      'Moving Coil Galvanometer (MCG)'
    ],
    'Magnetic Materials': [
      'Magnetic Dipole Moment of an Electron Revolving in Orbit',
      'Magnetization & Magnetic Intensity',
      'Diamagnetism, Paramagnetism & Ferromagnetism (Domain Theory)',
      'Curie Law & Curie Temperature',
      'Hysteresis Loop & Retentivity/Coercivity',
      'Permanent Magnets & Electromagnets'
    ],
    'Electromagnetic Induction': [
      'Faraday Laws of Electromagnetic Induction',
      'Lenz Law & Conservation of Energy',
      'Eddy Currents & Applications',
      'Self-Induction & Mutual Induction (Coefficients of Inductance)',
      'Energy Stored in a Magnetic Field',
      'AC Generator Principle & Construction'
    ],
    'AC Circuits': [
      'AC Voltage Applied to a Resistor, Inductor, Capacitor',
      'Phasor Diagrams & Impedance / Reactance',
      'Series LCR Circuit & Resonance (Resonant Frequency, Q-Factor)',
      'Power in AC Circuit & Power Factor',
      'Wattless Current & LC Oscillations',
      'Transformers & Step-Up / Step-Down Transformer Efficiency'
    ],
    'Dual Nature of Radiation and Matter': [
      'Photoelectric Effect & Lenard Observations',
      'Einstein Photoelectric Equation & Work Function',
      'de Broglie Wavelength & Dual Nature of Matter',
      'Davisson and Germer Experiment'
    ],
    'Structure of Atoms and Nuclei': [
      'Alpha Particle Scattering & Rutherford Atomic Model',
      'Bohr Model of Hydrogen Atom & Postulates',
      'Hydrogen Spectrum & Spectral Series (Lyman, Balmer, Paschen, etc.)',
      'De Broglie Explanation of Bohr Postulate',
      'Atomic Mass Unit, Mass Defect & Binding Energy per Nucleon',
      'Radioactive Decay Law, Half-Life & Decay Constant',
      'Nuclear Fission & Nuclear Fusion'
    ],
    'Semiconductor Devices': [
      'p-n Junction Diode Characteristics (Forward & Reverse Bias)',
      'p-n Junction Diode as a Rectifier (Half-Wave & Full-Wave Rectifiers)',
      'Zener Diode as a Voltage Regulator',
      'Photodiode, Solar Cell, & Light Emitting Diode (LED)',
      'Bipolar Junction Transistor (BJT) Characteristics & Amplifier',
      'Logic Gates (AND, OR, NOT, NAND, NOR) & Truth Tables'
    ]
  },

  // ==================== CHEMISTRY ====================
  Chemistry: {
    'Solid State': [
      'Classification of Solids (Crystalline & Amorphous)',
      'Crystal Lattices, Unit Cells & 14 Bravais Lattices',
      'Number of Atoms per Unit Cell (scc, bcc, fcc)',
      'Packing Efficiency in Metallic Crystals',
      'Density of Unit Cell Calculations',
      'Imperfections/Defects in Solids (Point Defects, Stoichiometric & Non-Stoichiometric)',
      'Electrical & Magnetic Properties of Solids (Band Theory)'
    ],
    'Solutions': [
      'Types of Solutions & Concentration Terms',
      'Solubility & Henry Law',
      'Vapor Pressure of Liquid Solutions & Raoult Law',
      'Ideal and Non-Ideal Solutions (Positive & Negative Deviations)',
      'Colligative Properties (Relative Lowering of Vapor Pressure, Elevation of Boiling Point, Depression of Freezing Point)',
      'Osmotic Pressure & Reverse Osmosis',
      'Abnormal Molar Masses & van t Hoff Factor'
    ],
    'Ionic Equilibria': [
      'Types of Electrolytes & Degree of Dissociation',
      'Ostwald Dilution Law for Weak Acids & Weak Bases',
      'Arrhenius, Bronsted-Lowry & Lewis Concepts of Acids and Bases',
      'Autoionization of Water & pH / pOH Scale',
      'Hydrolysis of Salts & pH of Salt Solutions',
      'Buffer Solutions (Acidic & Basic Buffers, Henderson-Hasselbalch Equation)',
      'Solubility Product ($K_{sp}$) & Common Ion Effect'
    ],
    'Chemical Thermodynamics': [
      'Terms in Thermodynamics (System, Surroundings, Boundaries, Types of Systems)',
      'State Functions & Path Functions, Extensive & Intensive Properties',
      'First Law of Thermodynamics & Enthalpy ($H$)',
      'Work Done in Isothermal & Reversible Expansion of Ideal Gas ($W_{max}$)',
      'Thermochemistry (Enthalpy of Reaction, Formation, Combustion, Neutralization)',
      'Hess Law of Constant Heat Summation & Applications',
      'Spontaneity of Reaction, Entropy ($S$) & Gibbs Free Energy ($G$)',
      'Second & Third Laws of Thermodynamics'
    ],
    'Electrochemistry': [
      'Electrolytic Conductance, Specific Conductance & Molar Conductivity',
      'Variation of Molar Conductivity with Concentration & Kohlrausch Law',
      'Electrolytic Cells & Faraday Laws of Electrolysis',
      'Galvanic / Voltaic Cells & Standard Hydrogen Electrode (SHE)',
      'Nernst Equation & Cell EMF Calculations',
      'Primary & Secondary Batteries (Lead Accumulator, Dry Cell, Fuel Cell)',
      'Corrosion Mechanism & Prevention'
    ],
    'Chemical Kinetics': [
      'Rate of Chemical Reaction (Average & Instantaneous Rate)',
      'Factors Influencing Rate of Reaction (Concentration, Temperature, Catalyst)',
      'Rate Law & Order / Molecularity of Reaction',
      'Integrated Rate Equations for Zero Order & First Order Reactions',
      'Half-Life of Zero Order & First Order Reactions',
      'Pseudo-First Order Reactions',
      'Arrhenius Equation & Activation Energy ($E_a$)',
      'Collision Theory of Reaction Rates'
    ],
    'Elements of Group 16, 17 & 18': [
      'Occurrences & Trends in Physical Properties of Group 16, 17, 18 Elements',
      'Anomalous Properties of Oxygen and Fluorine',
      'Allotropes of Sulfur & Dioxygen / Ozone Properties',
      'Oxides (Simple, Mixed, Neutral, Acidic, Basic Oxides)',
      'Sulfuric Acid Manufacturing (Contact Process) & Properties',
      'Oxoacids of Halogens & Interhalogen Compounds',
      'Noble Gases (Group 18) Compounds & Uses'
    ],
    'Transition & Inner Transition Elements': [
      'Position in Periodic Table & Electronic Configurations of d-Block Elements',
      'General Properties of Transition Elements (Oxidation States, Color, Catalytic, Magnetic)',
      'Preparation & Properties of Potassium Dichromate ($K_2Cr_2O_7$) & Potassium Permanganate ($KMnO_4$)',
      'f-Block Elements: Lanthanoids (Electronic Config, Lanthanoid Contraction & Consequences)',
      'Actinoids (Electronic Config, Oxidation States & Comparison with Lanthanoids)'
    ],
    'Coordination Compounds': [
      'Terminology: Ligands, Coordination Number, Coordination Sphere, Counter Ions',
      'IUPAC Nomenclature of Coordination Compounds',
      'Werner Theory of Coordination Compounds',
      'Isomerism in Coordination Compounds (Structural & Stereoisomerism)',
      'Valence Bond Theory (VBT) & Geometry / Hybridization of Complexes',
      'Crystal Field Theory (CFT) & d-Orbital Splitting in Octahedral / Tetrahedral Complexes',
      'Applications of Coordination Compounds'
    ],
    'Halogen Derivatives': [
      'Classification & Nomenclature of Alkyl & Aryl Halides',
      'Methods of Preparation of Alkyl Halides',
      'Physical Properties of Alkyl Halides',
      'Nucleophilic Substitution Reactions ($S_N1$ & $S_N2$ Mechanisms)',
      'Optical Activity & Enantiomers / Racemic Mixture',
      'Elimination Reactions (Saytzeff Rule) & Reactions with Metals (Grignard Reagents)',
      'Haloarenes ($S_N$ Reactions & Electrophilic Substitutions)'
    ],
    'Alcohols, Phenols and Ethers': [
      'Classification & IUPAC Nomenclature of Alcohols, Phenols, Ethers',
      'Methods of Preparation of Alcohols & Phenols (Hydroboration, Grignard, Cumene Process)',
      'Physical & Chemical Properties of Alcohols (Acidic Character, Esterification, Oxidation)',
      'Acidity of Phenols & Electrophilic Substitution Reactions (Nitration, Bromination, Kolbe, Reimer-Tiemann)',
      'Methods of Preparation of Ethers (Williamson Synthesis)',
      'Physical & Chemical Properties of Ethers (Cleavage of C-O Bond)'
    ],
    'Aldehydes, Ketones and Carboxylic Acids': [
      'Nomenclature & Structure of Carbonyl & Carboxyl Groups',
      'Methods of Preparation of Aldehydes & Ketones (Oxidation, Ozonolysis, Rosenmund, Stephen, Etard)',
      'Nucleophilic Addition Reactions of Aldehydes & Ketones (Addition of HCN, $NaHSO_3$, Grignard, Alcohol)',
      'Aldol Condensation & Cannizzaro Reaction',
      'Methods of Preparation of Carboxylic Acids',
      'Acidity of Carboxylic Acids & Chemical Reactions (Formation of Anhydrides, Esters, Amides)'
    ],
    'Amines': [
      'Classification & Nomenclature of Amines',
      'Methods of Preparation of Primary Amines (Reduction of Nitriles/Amides, Gabriel Phthalimide, Hofmann Bromamide)',
      'Physical Properties & Basicity of Amines (Comparison of Alkylamines & Arylamines)',
      'Chemical Reactions of Amines (Acylation, Carbylamine Test, Reaction with Nitrous Acid)',
      'Diazonium Salts Preparation & Synthetic Importance (Sandmeyer, Gattermann, Coupling Reactions)'
    ],
    'Biomolecules': [
      'Carbohydrates: Classification, D/L Configuration, Structure of Glucose & Fructose',
      'Disaccharides (Sucrose, Lactose, Maltose) & Polysaccharides (Starch, Cellulose, Glycogen)',
      'Proteins: Amino Acids, Peptide Bond, Primary/Secondary/Tertiary/Quaternary Structure, Denaturation',
      'Enzymes: Mechanism of Enzyme Action & Characteristics',
      'Vitamins: Classification (Fat-Soluble & Water-Soluble) & Deficiency Diseases',
      'Nucleic Acids: Structure of DNA & RNA, Nucleosides / Nucleotides, Genetic Code'
    ],
    'Introduction to Polymer Chemistry': [
      'Classification of Polymers (Natural/Synthetic, Structure, Molecular Forces)',
      'Types of Polymerization (Addition / Chain Growth & Condensation / Step Growth)',
      'Preparation & Properties of Important Addition Polymers (Polythene, Teflon, PVC, Orlon)',
      'Preparation & Properties of Important Condensation Polymers (Nylon 6,6, Nylon 6, Terylene, Bakelite)',
      'Natural & Synthetic Rubber & Vulcanization of Rubber',
      'Biodegradable Polymers (PHBV, Nylon 2-Nylon 6)'
    ],
    'Green Chemistry and Nano Chemistry': [
      'Principles of Green Chemistry (12 Principles & Atom Economy)',
      'Applications of Green Chemistry in Daily Life',
      'Introduction to Nano Chemistry & Nanomaterials (Nanoparticles, Nanotubes, Quantum Dots)',
      'Synthesis of Nanomaterials (Sol-Gel & Chemical Reduction Methods)',
      'Characterization & Applications of Nanomaterials'
    ]
  },

  // ==================== MATHEMATICS & STATISTICS ====================
  'Mathematics & Statistics': {
    'Mathematical Logic': [
      'Statements & Truth Values of Elementary Statements',
      'Logical Connectives (Conjunction, Disjunction, Conditional, Biconditional, Negation)',
      'Statement Patterns, Truth Tables & Logical Equivalence',
      'Tautology, Contradiction & Contingency',
      'Duality & Negation of Compound Statements',
      'Converse, Inverse & Contrapositive of Conditional Statement',
      'Quantifiers & Quantified Statements',
      'Application of Logic to Switching Circuits (Series & Parallel Circuits)'
    ],
    'Matrices': [
      'Types of Matrices & Operations on Matrices',
      'Elementary Row & Column Transformations',
      'Inverse of a Matrix using Elementary Transformations',
      'Inverse of a Matrix using Adjoint Method',
      'Application of Matrices: Solving System of Linear Equations (Inversion Method & Reduction Method)'
    ],
    'Trigonometric Functions': [
      'Trigonometric Equations & General Solutions',
      'Solutions of Triangles: Sine Rule, Cosine Rule, Projection Rule',
      'Applications of Sine & Cosine Rules (Area of Triangle, Half-Angle Formulas)',
      'Inverse Trigonometric Functions & Properties / Principal Values'
    ],
    'Pair of Straight Lines': [
      'Combined Equation of a Pair of Lines',
      'Homogeneous Equation of Degree Two in x and y',
      'Angle between the Lines Represented by $ax^2 + 2hxy + by^2 = 0$',
      'Condition for Perpendicular & Parallel Lines',
      'General Second Degree Equation in x and y Representing a Pair of Lines',
      'Point of Intersection of Lines & Condition for Concurrency'
    ],
    'Vectors': [
      'Vectors & Types of Vectors, Position Vector of a Point',
      'Section Formula (Internal & External Division) & Midpoint Formula / Centroid Theorem',
      'Scalar (Dot) Product & Vector (Cross) Product of Two Vectors & Properties',
      'Scalar Triple Product & Volume of Parallelopiped / Tetrahedron',
      'Vector Triple Product & Applications'
    ],
    'Line and Plane': [
      'Vector & Cartesian Equations of a Line passing through One/Two Points',
      'Distance between Two Skew Lines & Distance between Parallel Lines',
      'Vector & Cartesian Equations of a Plane',
      'Angle between Two Planes & Angle between a Line and a Plane',
      'Distance of a Point from a Plane & Coplanarity of Two Lines'
    ],
    'Linear Programming': [
      'Linear Inequalities in Two Variables & Feasible Region',
      'Formulation of Linear Programming Problem (LPP)',
      'Graphical Solution of LPP (Corner Point Method)',
      'Bounded and Unbounded Feasible Regions & Optimal Solutions'
    ],
    'Differentiation': [
      'Derivative of Composite Functions (Chain Rule)',
      'Derivative of Implicit Functions',
      'Derivative of Inverse Trigonometric Functions',
      'Logarithmic Differentiation',
      'Derivative of Parametric Functions',
      'Higher Order Derivatives (Second Order Derivatives)'
    ],
    'Applications of Derivatives': [
      'Equations of Tangents & Normals to a Curve',
      'Derivative as a Rate Measure & Approximations',
      'Rolle Theorem & Lagrange Mean Value Theorem',
      'Increasing & Decreasing Functions',
      'Maxima and Minima (First & Second Derivative Tests)'
    ],
    'Indefinite Integration': [
      'Elementary Integration Formulas & Properties',
      'Integration by Substitution Method',
      'Integration by Parts Method ($\int u v \, dx$)',
      'Integration using Partial Fractions',
      'Integrals of Special Trigonometric & Algebraic Functions'
    ],
    'Definite Integration': [
      'Definite Integral as Limit of a Sum',
      'Fundamental Theorem of Calculus',
      'Properties of Definite Integrals & Applications'
    ],
    'Application of Definite Integration': [
      'Area under a Curve $y = f(x)$ between $x = a$ and $x = b$',
      'Area bounded between Two Curves'
    ],
    'Differential Equations': [
      'Order & Degree of a Differential Equation',
      'Formation of Differential Equation by Eliminating Arbitrary Constants',
      'Solution of Differential Equation: Variable Separable Method',
      'Homogeneous Differential Equations',
      'Linear Differential Equations ($\frac{dy}{dx} + Py = Q$)',
      'Applications of Differential Equations (Population Growth, Radioactive Decay, Newton Law of Cooling)'
    ],
    'Probability Distributions': [
      'Random Variables (Discrete & Continuous)',
      'Probability Mass Function (PMF) & Cumulative Distribution Function (CDF)',
      'Expected Value ($E[X]$), Variance ($Var(X)$) & Standard Deviation'
    ],
    'Binomial Distribution': [
      'Bernoulli Trials & Definition of Binomial Distribution',
      'Probability Function of Binomial Distribution $P(X = k) = \binom{n}{k} p^k q^{n-k}$',
      'Mean ($\mu = np$) and Variance ($\sigma^2 = npq$) of Binomial Distribution'
    ]
  },

  // ==================== BIOLOGY ====================
  Biology: {
    'Reproduction in Lower and Higher Plants': [
      'Asexual Reproduction (Budding, Fragmentation, Spore Formation, Vegetative Propagation)',
      'Structure of Anther, Microsporogenesis & Male Gametophyte Development',
      'Structure of Anatropous Ovule, Megasporogenesis & Female Gametophyte (Embryo Sac)',
      'Pollination Types (Autogamy, Geitonogamy, Xenogamy) & Agencies of Pollination',
      'Outbreeding Devices & Pollen-Pistil Interaction',
      'Double Fertilization Mechanism & Significance',
      'Post-Fertilization Events (Endosperm & Embryo Development, Seed & Fruit Formation)',
      'Apomixis, Polyembryony & Parthenocarpy'
    ],
    'Reproduction in Lower and Higher Animals': [
      'Asexual Reproduction in Animals (Gemmule Formation, Budding, Regeneration)',
      'Human Male Reproductive System (Structure & Functions)',
      'Human Female Reproductive System (Structure & Functions)',
      'Gametogenesis: Spermatogenesis & Oogenesis (Hormonal Control)',
      'Menstrual Cycle (Phases & Hormonal Regulation)',
      'Fertilization, Cleavage, Blastulation & Implantation',
      'Embryonic Development, Placenta & Pregnancy',
      'Parturition & Lactation',
      'Birth Control Methods, Contraception & Assisted Reproductive Technologies (ART - IVF, ZIFT, GIFT)'
    ],
    'Inheritance and Variation': [
      'Mendel Experiments & Laws of Inheritance (Monohybrid & Dihybrid Crosses)',
      'Deviations from Mendelian Inheritance (Incomplete Dominance, Co-dominance, Multiple Alleles)',
      'Pleiotropy & Polygenic Inheritance',
      'Chromosomal Theory of Inheritance',
      'Linkage & Crossing Over (Complete & Incomplete Linkage)',
      'Sex Determination (Humans, Birds, Honeybees)',
      'Sex-Linked Inheritance (Colorblindness & Hemophilia)',
      'Genetic Disorders (Thalassemia, Down Syndrome, Turner Syndrome, Klinefelter Syndrome)'
    ],
    'Molecular Basis of Inheritance': [
      'Discovery of DNA as Genetic Material (Griffith, Avery-MacLeod-McCarty, Hershey-Chase)',
      'Structure of DNA (Watson-Crick Model) & RNA (mRNA, tRNA, rRNA)',
      'Packaging of DNA (Nucleosome Model)',
      'DNA Replication (Semi-Conservative Mechanism & Enzymes)',
      'Central Dogma of Molecular Biology & Transcription in Prokaryotes / Eukaryotes',
      'Genetic Code (Characteristics & Codon Table)',
      'Translation (Protein Synthesis Mechanism)',
      'Regulation of Gene Expression (Lac Operon Model in E. coli)',
      'Human Genome Project (HGP) & DNA Fingerprinting'
    ],
    'Origin and Evolution of Life': [
      'Origin of Life (Chemical Evolution - Oparin-Haldane Hypothesis & Urey-Miller Experiment)',
      'Organic Evolution & Evidences for Evolution (Paleontological, Morphological, Embryological)',
      'Darwinism & Natural Selection Theory',
      'Modern Synthetic Theory of Evolution (Genetic Variation, Natural Selection, Isolation)',
      'Hardy-Weinberg Principle & Factors Affecting Genetic Equilibrium',
      'Adaptive Radiation & Speciation',
      'Human Evolution (Dryopithecus to Homo sapiens sapiens)'
    ],
    'Plant Water Relation': [
      'Properties of Water & Importance to Plants',
      'Water Absorption by Roots (Root Hair Structure & Mechanism)',
      'Water Potential ($\Psi_w$), Osmotic Potential ($\Psi_s$), Pressure Potential ($\Psi_p$)',
      'Plasmolysis, Imbibition & Diffusion',
      'Absorption of Water (Apoplast & Symplast Pathways)',
      'Ascent of Sap (Transpiration Pull Theory)',
      'Transpiration (Structure of Stomata, Mechanism of Stomatal Opening/Closing)',
      'Guttation & Exudation'
    ],
    'Plant Growth and Mineral Nutrition': [
      'Phases of Plant Growth & Growth Rate (Arithmetic & Geometric Growth)',
      'Conditions for Growth & Differentiation, Dedifferentiation, Redifferentiation',
      'Plant Growth Regulators (Auxins, Gibberellins, Cytokinins, Ethylene, Abscisic Acid)',
      'Photoperiodism (Short Day, Long Day, Day Neutral Plants) & Vernalization',
      'Mineral Nutrition: Essential Macro & Micro Nutrients, Deficiency Symptoms',
      'Nitrogen Cycle & Biological Nitrogen Fixation'
    ],
    'Respiration and Circulation': [
      'Human Respiratory System (Anatomy & Physiology of Respiration)',
      'Mechanism of Respiration (Inspiration, Expiration, Pulmonary Volumes & Capacities)',
      'Transport of Gases ($O_2$ and $CO_2$ Transport in Blood, Oxygen Dissociation Curve)',
      'Regulation of Respiration & Respiratory Disorders',
      'Composition of Blood & Blood Groups (ABO & Rh System)',
      'Structure & Working of Human Heart (Cardiac Cycle, Heart Sounds, ECG)',
      'Blood Vessels, Double Circulation, Systemic & Pulmonary Circulation',
      'Lymphatic System & Cardiovascular Disorders (Hypertension, CAD, Angina)'
    ],
    'Control and Co-ordination': [
      'Nervous System Architecture & Structure of Neuron',
      'Conduction of Nerve Impulse (Depolarization, Repolarization, Synaptic Transmission)',
      'Human Brain Anatomy (Forebrain, Midbrain, Hindbrain) & Spinal Cord',
      'Reflex Action & Reflex Arc',
      'Sensory Receptors (Structure & Function of Eye & Ear)',
      'Endocrine System: Pituitary, Thyroid, Parathyroid, Adrenal, Pancreas, Gonads',
      'Mechanism of Hormone Action (Peptide & Steroid Hormones)',
      'Hormonal Disorders'
    ],
    'Human Health and Diseases': [
      'Concept of Health & Disease, Immune System Overview',
      'Innate & Acquired Immunity, Active & Passive Immunity',
      'Structure of Antibody & Antigen-Antibody Interaction',
      'Vaccination & Immunization',
      'Common Human Diseases: Typhoid, Malaria, Amoebiasis, Ascariasis, Ringworm, Pneumonia',
      'AIDS (HIV Structure, Transmission, Prevention) & Cancer (Types, Causes, Diagnosis, Treatment)',
      'Adolescence, Drug and Alcohol Abuse'
    ],
    'Enhancement of Food Production': [
      'Plant Breeding (Steps & Applications for Disease Resistance, Pest Resistance, Biofortification)',
      'Tissue Culture (Micropropagation, Somaclonal Variation, Somatic Hybridization)',
      'Single Cell Protein (SCP) & Animal Husbandry Overview',
      'Microbes in Human Welfare (Household Use, Industrial Products, Sewage Treatment, Biogas)',
      'Microbes as Biocontrol Agents & Biofertilizers'
    ],
    'Biotechnology': [
      'Principles of Biotechnology & Recombinant DNA Technology',
      'Tools of rDNA Technology (Restriction Enzymes, DNA Ligase, Cloning Vectors - Plasmids, Host Organisms)',
      'Processes of Recombinant DNA Technology (Isolation, Insertion, Transformation, Bioreactors)',
      'Applications of Biotechnology in Agriculture (Bt Cotton, Flavr Savr Tomato, RNA Interference)',
      'Applications of Biotechnology in Medicine (Humulin Insulin, Gene Therapy, Molecular Diagnostics)',
      'Transgenic Animals & Ethical Issues / Biosafety'
    ],
    'Organisms and Populations': [
      'Organisms and Environment (Major Abiotic Factors & Responses to Abiotic Factors)',
      'Adaptations (Morphological, Physiological, Behavioral)',
      'Population Attributes (Birth Rate, Death Rate, Sex Ratio, Age Distribution)',
      'Population Growth Models (Exponential Growth & Logistic Growth)',
      'Population Interactions (Mutualism, Competition, Predation, Parasitism, Commensalism, Amensalism)'
    ],
    'Ecosystems and Energy Flow': [
      'Ecosystem Structure & Function (Abiotic & Biotic Components)',
      'Primary Productivity & Secondary Productivity',
      'Decomposition Process (Fragmentation, Leaching, Catabolism, Humification, Mineralization)',
      'Energy Flow in Ecosystem & Trophic Levels',
      'Ecological Pyramids (Number, Biomass, Energy)',
      'Ecological Succession (Primary & Secondary Succession, Hydrarch & Xerarch)',
      'Nutrient Cycling (Carbon & Phosphorus Cycles)'
    ],
    'Biodiversity, Conservation and Environmental Issues': [
      'Concept of Biodiversity & Levels of Biodiversity (Genetic, Species, Ecological)',
      'Patterns of Biodiversity & Latitudinal Gradients',
      'Loss of Biodiversity & Causes (Evil Quartet)',
      'Biodiversity Conservation Methods (In-situ: National Parks, Sanctuaries & Ex-situ: Botanical Gardens, Seed Banks)',
      'Sacred Groves & Biodiversity Hotspots',
      'Environmental Issues: Air Pollution, Water Pollution, Solid Waste Management',
      'Greenhouse Effect, Global Warming & Ozone Layer Depletion'
    ]
  }
};

/**
 * Synchronize database Topic records with the comprehensive MSB Curriculum Matrix
 */
async function syncOfficialSyllabusTopics() {
  console.log('🔄 Executing Official MSB Syllabus Topic Sync Pipeline...\n');

  let totalAdded = 0;
  let totalExisting = 0;
  const auditReport = [];

  for (const [subjectName, chapterMap] of Object.entries(MSB_CURRICULUM_TOPIC_MATRIX)) {
    // Find subject in database
    const subjects = await prisma.subject.findMany({
      where: { name: { contains: subjectName, mode: 'insensitive' } }
    });

    if (!subjects.length) {
      console.warn(`⚠️ Subject "${subjectName}" not found in database. Skipping.`);
      continue;
    }

    for (const subject of subjects) {
      const dbChapters = await prisma.chapter.findMany({
        where: { subjectId: subject.id },
        include: { topics: true }
      });

      for (const [chapterTitle, targetTopics] of Object.entries(chapterMap)) {
        // Find matching chapter by title (fuzzy match)
        const chapter = dbChapters.find(c => 
          c.name.toLowerCase().trim() === chapterTitle.toLowerCase().trim() ||
          c.name.toLowerCase().includes(chapterTitle.toLowerCase()) ||
          chapterTitle.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!chapter) {
          console.warn(`  ⚠️ Chapter "${chapterTitle}" not found in DB for ${subject.name}. Skipping.`);
          continue;
        }

        const existingTopicNames = new Set(chapter.topics.map(t => t.name.toLowerCase().trim()));
        let chapterAddedCount = 0;

        for (const topicName of targetTopics) {
          if (existingTopicNames.has(topicName.toLowerCase().trim())) {
            totalExisting++;
          } else {
            // Upsert missing official topic
            await prisma.topic.create({
              data: {
                name: topicName,
                chapterId: chapter.id
              }
            });
            chapterAddedCount++;
            totalAdded++;
          }
        }

        auditReport.push({
          subject: subject.name,
          chapter: chapter.name,
          added: chapterAddedCount,
          total: targetTopics.length
        });
      }
    }
  }

  console.log('\n====================================================');
  console.log('🎉 SYLLABUS TOPIC SYNC COMPLETED SUCCESSFULLY!');
  console.log(`   - Existing topics preserved: ${totalExisting}`);
  console.log(`   - New official curriculum topics added: ${totalAdded}`);
  console.log('====================================================\n');

  return { totalAdded, totalExisting, auditReport };
}

module.exports = {
  MSB_CURRICULUM_TOPIC_MATRIX,
  syncOfficialSyllabusTopics
};
