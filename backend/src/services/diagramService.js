const prisma = require('../config/prisma');

/**
 * Pre-defined Clean Vector SVG Diagrams for Biology, Physics, and Chemistry Curriculum
 */
const SVG_DIAGRAMS = {
  // --- BIOLOGY DIAGRAMS ---
  human_heart: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">ANATOMY OF HUMAN HEART (CIRCULATORY SYSTEM)</text>
      
      <!-- Main Heart Body -->
      <path d="M 220 120 C 180 60 110 90 120 160 C 130 230 250 330 300 370 C 350 330 470 230 480 160 C 490 90 420 60 380 120 C 350 160 250 160 220 120 Z" fill="#fecdd3" stroke="#e11d48" stroke-width="3"/>
      
      <!-- Internal Septum Divider -->
      <path d="M 300 150 L 300 365" stroke="#be123c" stroke-width="4" stroke-dasharray="4 2"/>
      
      <!-- Superior & Inferior Vena Cava -->
      <rect x="150" y="50" width="30" height="90" fill="#93c5fd" stroke="#2563eb" stroke-width="2"/>
      <text x="125" y="45" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1e40af">Superior Vena Cava</text>
      
      <!-- Aorta Arch -->
      <path d="M 280 140 C 280 60 370 60 370 120" fill="none" stroke="#dc2626" stroke-width="16" stroke-linecap="round"/>
      <text x="385" y="55" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#991b1b">Aorta</text>

      <!-- Pulmonary Artery -->
      <path d="M 250 150 C 250 90 200 80 180 80" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
      
      <!-- Chambers Labels & Pointers -->
      <!-- Right Atrium -->
      <circle cx="210" cy="180" r="25" fill="#dbeafe" opacity="0.8"/>
      <text x="210" y="184" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">RA</text>
      <line x1="210" y1="180" x2="90" y2="180" stroke="#1e3a8a" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="85" y="184" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="end">Right Atrium</text>

      <!-- Left Atrium -->
      <circle cx="390" cy="180" r="25" fill="#ffe4e6" opacity="0.8"/>
      <text x="390" y="184" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#881337" text-anchor="middle">LA</text>
      <line x1="390" y1="180" x2="510" y2="180" stroke="#881337" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="515" y="184" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#881337">Left Atrium</text>

      <!-- Right Ventricle -->
      <circle cx="230" cy="270" r="30" fill="#dbeafe" opacity="0.8"/>
      <text x="230" y="274" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="middle">RV</text>
      <line x1="230" y1="270" x2="90" y2="270" stroke="#1e3a8a" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="85" y="274" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="end">Right Ventricle</text>

      <!-- Left Ventricle -->
      <circle cx="370" cy="270" r="30" fill="#ffe4e6" opacity="0.8"/>
      <text x="370" y="274" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#881337" text-anchor="middle">LV</text>
      <line x1="370" y1="270" x2="510" y2="270" stroke="#881337" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="515" y="274" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#881337">Left Ventricle</text>

      <!-- Septum -->
      <line x1="300" y1="310" x2="300" y2="395" stroke="#475569" stroke-width="1.5"/>
      <text x="300" y="408" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Interventricular Septum</text>
    </svg>
  `,

  nephron: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">STRUCTURE OF NEPHRON (FUNCTIONAL UNIT OF KIDNEY)</text>
      
      <!-- Bowman's Capsule & Glomerulus -->
      <path d="M 120 120 C 80 120 80 180 120 180 C 150 180 150 120 120 120 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="115" cy="150" r="16" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/>
      
      <!-- PCT (Proximal Convoluted Tubule) -->
      <path d="M 140 160 C 180 130 180 200 220 150" fill="none" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>

      <!-- Loop of Henle -->
      <path d="M 220 150 L 220 320 C 220 360 270 360 270 320 L 270 150" fill="none" stroke="#ca8a04" stroke-width="6"/>

      <!-- DCT (Distal Convoluted Tubule) -->
      <path d="M 270 150 C 310 110 330 190 380 150" fill="none" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>

      <!-- Collecting Duct -->
      <line x1="380" y1="80" x2="380" y2="380" stroke="#854d0e" stroke-width="12" stroke-linecap="round"/>
      <line x1="380" y1="120" x2="420" y2="100" stroke="#854d0e" stroke-width="6"/>
      <line x1="380" y1="200" x2="420" y2="180" stroke="#854d0e" stroke-width="6"/>

      <!-- Labels -->
      <line x1="115" y1="150" x2="40" y2="130" stroke="#dc2626" stroke-width="1.5"/>
      <text x="35" y="130" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#991b1b" text-anchor="end">Glomerulus</text>

      <line x1="130" y1="175" x2="40" y2="185" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="35" y="188" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="end">Bowman's Capsule</text>

      <line x1="180" y1="155" x2="180" y2="70" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="180" y="65" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">PCT (Proximal Tubule)</text>

      <line x1="245" y1="340" x2="245" y2="400" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="245" y="412" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">Loop of Henle</text>

      <line x1="320" y1="150" x2="320" y2="70" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="320" y="65" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">DCT (Distal Tubule)</text>

      <line x1="380" y1="240" x2="490" y2="240" stroke="#854d0e" stroke-width="1.5"/>
      <text x="495" y="244" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#713f12">Collecting Duct</text>
    </svg>
  `,

  neuron: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">STRUCTURE OF NEURON (NERVE CELL)</text>

      <!-- Cyton / Cell Body -->
      <path d="M 120 210 Q 80 160 100 120 Q 140 140 170 110 Q 180 160 210 170 Q 180 200 200 240 Q 150 220 120 210 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="3"/>
      <circle cx="150" cy="170" r="18" fill="#c084fc" stroke="#7e22ce" stroke-width="2"/>
      <text x="150" y="174" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">N</text>

      <!-- Dendrites -->
      <path d="M 100 120 L 60 80 M 140 140 L 130 70 M 170 110 L 210 60 M 120 210 L 70 240" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Axon & Myelin Sheath Sheaths -->
      <line x1="210" y1="180" x2="480" y2="180" stroke="#c2410c" stroke-width="6"/>
      
      <!-- Myelin Sheath Nodes -->
      <rect x="230" y="165" width="45" height="30" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <rect x="290" y="165" width="45" height="30" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <rect x="350" y="165" width="45" height="30" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <rect x="410" y="165" width="45" height="30" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>

      <!-- Axon Terminals -->
      <path d="M 480 180 L 530 140 M 480 180 L 540 180 M 480 180 L 530 220" stroke="#c2410c" stroke-width="3"/>
      <circle cx="530" cy="140" r="4" fill="#c2410c"/>
      <circle cx="540" cy="180" r="4" fill="#c2410c"/>
      <circle cx="530" cy="220" r="4" fill="#c2410c"/>

      <!-- Labels -->
      <line x1="70" y1="80" x2="30" y2="80" stroke="#ea580c" stroke-width="1.5"/>
      <text x="25" y="84" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#c2410c" text-anchor="end">Dendrites</text>

      <line x1="150" y1="170" x2="150" y2="290" stroke="#7e22ce" stroke-width="1.5"/>
      <text x="150" y="305" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#6b21a8" text-anchor="middle">Nucleus & Cyton</text>

      <line x1="310" y1="165" x2="310" y2="100" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="310" y="95" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#a16207" text-anchor="middle">Myelin Sheath</text>

      <line x1="280" y1="180" x2="280" y2="290" stroke="#c2410c" stroke-width="1.5"/>
      <text x="280" y="305" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#9a3412" text-anchor="middle">Node of Ranvier</text>

      <line x1="390" y1="195" x2="390" y2="340" stroke="#c2410c" stroke-width="1.5"/>
      <text x="390" y="355" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#9a3412" text-anchor="middle">Axon</text>

      <line x1="535" y1="180" x2="570" y2="180" stroke="#c2410c" stroke-width="1.5"/>
      <text x="575" y="184" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#9a3412">Synaptic Terminals</text>
    </svg>
  `,

  plant_cell: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">DIAGRAM OF PLANT CELL & ORGANELLES</text>

      <!-- Rigid Outer Cell Wall -->
      <polygon points="120,60 480,60 520,360 80,360" fill="#dcfce7" stroke="#15803d" stroke-width="6"/>
      <polygon points="130,72 470,72 508,348 92,348" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>

      <!-- Large Central Vacuole -->
      <ellipse cx="320" cy="220" rx="100" ry="70" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
      <text x="320" y="224" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Central Vacuole</text>

      <!-- Nucleus -->
      <circle cx="180" cy="160" r="35" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="180" cy="160" r="14" fill="#ca8a04"/>

      <!-- Chloroplasts -->
      <ellipse cx="430" cy="140" rx="25" ry="14" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>
      <ellipse cx="440" cy="290" rx="25" ry="14" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>

      <!-- Mitochondria -->
      <ellipse cx="170" cy="280" rx="22" ry="12" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/>

      <!-- Labels -->
      <line x1="80" y1="120" x2="30" y2="120" stroke="#15803d" stroke-width="1.5"/>
      <text x="25" y="124" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="end">Cell Wall</text>

      <line x1="180" y1="125" x2="180" y2="40" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="180" y="35" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">Nucleus</text>

      <line x1="440" y1="126" x2="540" y2="126" stroke="#16a34a" stroke-width="1.5"/>
      <text x="545" y="130" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#14532d">Chloroplast</text>

      <line x1="170" y1="292" x2="170" y2="390" stroke="#dc2626" stroke-width="1.5"/>
      <text x="170" y="404" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#991b1b" text-anchor="middle">Mitochondrion</text>
    </svg>
  `,

  dna_structure: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">DNA DOUBLE HELIX STRUCTURE (WATSON & CRICK MODEL)</text>

      <!-- Helical Backbone 1 -->
      <path d="M 150 80 Q 300 160 450 80 T 450 340" fill="none" stroke="#2563eb" stroke-width="5"/>
      <!-- Helical Backbone 2 -->
      <path d="M 150 160 Q 300 80 450 160 T 450 260" fill="none" stroke="#dc2626" stroke-width="5"/>

      <!-- Base Pairs Rungs -->
      <line x1="200" y1="105" x2="200" y2="135" stroke="#16a34a" stroke-width="4"/>
      <line x1="250" y1="125" x2="250" y2="115" stroke="#ca8a04" stroke-width="4"/>
      <line x1="300" y1="120" x2="300" y2="120" stroke="#2563eb" stroke-width="4"/>
      <line x1="350" y1="105" x2="350" y2="135" stroke="#dc2626" stroke-width="4"/>
      <line x1="400" y1="90" x2="400" y2="150" stroke="#16a34a" stroke-width="4"/>

      <!-- Labels -->
      <text x="100" y="90" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e40af">5' End</text>
      <text x="100" y="170" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#991b1b">3' End</text>
      
      <rect x="180" y="320" width="240" height="60" fill="#ffffff" stroke="#94a3b8" rx="6"/>
      <text x="300" y="340" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Base Pairing Rules:</text>
      <text x="300" y="360" font-family="Arial, sans-serif" font-size="11" fill="#0f172a" text-anchor="middle">Adenine (A) = Thymine (T)  |  Guanine (G) ≡ Cytosine (C)</text>
    </svg>
  `,

  // --- PHYSICS DIAGRAMS ---
  prism_refraction: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">REFRACTION OF LIGHT THROUGH GLASS PRISM</text>

      <!-- Glass Prism Triangle -->
      <polygon points="300,70 120,340 480,340" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" opacity="0.85"/>
      <text x="300" y="60" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1" text-anchor="middle">A</text>
      <text x="105" y="355" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">B</text>
      <text x="490" y="355" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">C</text>

      <!-- Incident Ray -->
      <line x1="50" y1="280" x2="210" y2="205" stroke="#dc2626" stroke-width="3"/>
      <polygon points="135,235 145,245 130,248" fill="#dc2626"/>

      <!-- Refracted Ray inside Prism -->
      <line x1="210" y1="205" x2="390" y2="235" stroke="#dc2626" stroke-width="3"/>

      <!-- Emergent Ray -->
      <line x1="390" y1="235" x2="540" y2="310" stroke="#dc2626" stroke-width="3"/>

      <!-- Angle of Deviation Delta -->
      <line x1="210" y1="205" x2="430" y2="100" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
      <line x1="390" y1="235" x2="310" y2="155" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>

      <!-- Labels -->
      <text x="80" y="260" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#991b1b">Incident Ray</text>
      <text x="290" y="220" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#991b1b">Refracted Ray</text>
      <text x="460" y="275" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#991b1b">Emergent Ray</text>
      <text x="365" y="140" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2563eb">δ (Deviation Angle)</text>
    </svg>
  `,

  circuit_diagram: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">ELECTRIC CIRCUIT DIAGRAM (OHM'S LAW SETUP)</text>

      <!-- Loop Wires -->
      <rect x="120" y="100" width="360" height="200" fill="none" stroke="#0f172a" stroke-width="3"/>

      <!-- Battery Source (Bottom) -->
      <rect x="275" y="290" width="50" height="20" fill="#f8fafc"/>
      <line x1="285" y1="285" x2="285" y2="315" stroke="#dc2626" stroke-width="4"/>
      <line x1="305" y1="292" x2="305" y2="308" stroke="#2563eb" stroke-width="3"/>
      <text x="260" y="325" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#dc2626">+</text>
      <text x="320" y="325" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2563eb">-</text>
      <text x="295" y="340" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">DC Battery (V)</text>

      <!-- Resistor (Top) -->
      <rect x="250" y="90" width="100" height="20" fill="#f8fafc"/>
      <path d="M 250 100 L 260 90 L 270 110 L 280 90 L 290 110 L 300 90 L 310 110 L 320 90 L 330 110 L 340 90 L 350 100" fill="none" stroke="#d97706" stroke-width="3"/>
      <text x="300" y="75" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#b45309" text-anchor="middle">Resistor (R)</text>

      <!-- Ammeter (Left) -->
      <circle cx="120" cy="200" r="22" fill="#ffffff" stroke="#2563eb" stroke-width="3"/>
      <text x="120" y="206" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1d4ed8" text-anchor="middle">A</text>
      <text x="75" y="204" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1e40af">Ammeter</text>

      <!-- Voltmeter (Parallel to Resistor) -->
      <path d="M 220 100 L 220 40 L 380 40 L 380 100" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="4 2"/>
      <circle cx="300" cy="40" r="18" fill="#ffffff" stroke="#059669" stroke-width="2.5"/>
      <text x="300" y="45" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#047857" text-anchor="middle">V</text>
      <text x="300" y="18" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">Voltmeter</text>
    </svg>
  `,

  wheatstone_bridge: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">WHEATSTONE BRIDGE CIRCUIT (BALANCED NETWORK)</text>

      <!-- Diamond Bridge Wires -->
      <polygon points="300,80 450,200 300,320 150,200" fill="none" stroke="#0f172a" stroke-width="3"/>

      <!-- Resistors P, Q, R, S -->
      <!-- P Top Left -->
      <text x="210" y="125" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#b45309">P</text>
      <!-- Q Top Right -->
      <text x="380" y="125" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#b45309">Q</text>
      <!-- R Bottom Left -->
      <text x="210" y="280" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#b45309">R</text>
      <!-- S Bottom Right -->
      <text x="380" y="280" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#b45309">S</text>

      <!-- Galvanometer Central Arm -->
      <line x1="300" y1="80" x2="300" y2="320" stroke="#2563eb" stroke-width="2.5"/>
      <circle cx="300" cy="200" r="22" fill="#ffffff" stroke="#2563eb" stroke-width="3"/>
      <text x="300" y="206" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1d4ed8" text-anchor="middle">G</text>

      <!-- Condition Formula Banner -->
      <rect x="180" y="355" width="240" height="45" fill="#f1f5f9" stroke="#94a3b8" rx="6"/>
      <text x="300" y="382" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">Balance Condition: P / Q = R / S</text>
    </svg>
  `,

  // --- CHEMISTRY DIAGRAMS ---
  galvanic_cell: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%">
      <rect width="600" height="420" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <text x="300" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">GALVANIC / ELECTROCHEMICAL CELL (Zn-Cu DANIEL CELL)</text>

      <!-- Left Beaker (Anode - Zn) -->
      <rect x="100" y="180" width="140" height="160" fill="#eff6ff" stroke="#3b82f6" stroke-width="3" rx="4"/>
      <rect x="145" y="120" width="25" height="180" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <text x="170" y="365" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Zn Anode (-)</text>
      <text x="170" y="320" font-family="Arial, sans-serif" font-size="11" fill="#2563eb" text-anchor="middle">ZnSO₄ Solution</text>

      <!-- Right Beaker (Cathode - Cu) -->
      <rect x="360" y="180" width="140" height="160" fill="#fff7ed" stroke="#ea580c" stroke-width="3" rx="4"/>
      <rect x="430" y="120" width="25" height="180" fill="#fdba74" stroke="#c2410c" stroke-width="2"/>
      <text x="430" y="365" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#9a3412" text-anchor="middle">Cu Cathode (+)</text>
      <text x="430" y="320" font-family="Arial, sans-serif" font-size="11" fill="#ea580c" text-anchor="middle">CuSO₄ Solution</text>

      <!-- Salt Bridge -->
      <path d="M 210 220 L 210 140 Q 210 120 230 120 L 370 120 Q 390 120 390 140 L 390 220" fill="none" stroke="#a855f7" stroke-width="18"/>
      <text x="300" y="112" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#6b21a8" text-anchor="middle">Salt Bridge (KCl)</text>

      <!-- Voltmeter Wire -->
      <path d="M 157 120 L 157 80 L 442 80 L 442 120" fill="none" stroke="#0f172a" stroke-width="3"/>
      <circle cx="300" cy="80" r="20" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
      <text x="300" y="85" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">V</text>
      <text x="300" y="52" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#16a34a" text-anchor="middle">e⁻ Flow →</text>
    </svg>
  `
};

/**
 * Dynamic Generic SVG Diagram Generator Fallback
 */
function generateDynamicSvgDiagram(title, subjectName, chapterName) {
  const cleanTitle = (title || 'Curriculum Concept Diagram').toUpperCase();
  const subj = (subjectName || 'Science').toUpperCase();
  const ch = (chapterName || 'Standard Textbook').toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="100%" height="100%">
      <rect width="600" height="360" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="15" y="15" width="570" height="330" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 3" rx="6"/>
      
      <!-- Banner Header -->
      <rect x="40" y="30" width="520" height="40" fill="#e2e8f0" rx="6"/>
      <text x="300" y="55" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">${cleanTitle}</text>
      
      <!-- Central Scientific Graphic Box -->
      <rect x="120" y="90" width="360" height="180" fill="#ffffff" stroke="#3b82f6" stroke-width="2.5" rx="8"/>
      
      <!-- Decorative Diagram Elements -->
      <circle cx="200" cy="180" r="45" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <polygon points="400,135 440,225 360,225" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <line x1="200" y1="180" x2="400" y2="180" stroke="#059669" stroke-width="3" stroke-dasharray="4 2"/>
      
      <text x="200" y="184" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">Structure A</text>
      <text x="400" y="195" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#854d0e" text-anchor="middle">Structure B</text>
      <text x="300" y="170" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">Interraction / Flow</text>

      <!-- Footer Info -->
      <text x="300" y="305" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">${subj} • ${ch}</text>
      <text x="300" y="325" font-family="Arial, sans-serif" font-size="10" font-style="italic" fill="#94a3b8" text-anchor="middle">Reference Figure for Examination Question Paper</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Match or Generate Diagram Image URL for a given question
 */
async function getOrAttachDiagram(question, subjectName = '', chapterName = '') {
  const stem = (question.questionText || question.question || '').toLowerCase();
  const topicTag = (question.diagramTopic || '').toLowerCase();
  const subjUpper = (subjectName || '').toUpperCase();

  // Keyword to SVG Diagram Key mapping
  const diagramKeyMap = [
    { key: 'human_heart', regex: /heart|cardiac|atrium|ventricle|aorta|vena cava/i },
    { key: 'nephron', regex: /nephron|glomerulus|bowman|kidney unit|tubule/i },
    { key: 'neuron', regex: /neuron|nerve cell|axon|dendrite|myelin/i },
    { key: 'plant_cell', regex: /plant cell|cell wall|vacuole|organelle/i },
    { key: 'chloroplast_structure', regex: /chloroplast|thylakoid|grana|stroma/i },
    { key: 'dna_structure', regex: /dna|double helix|nucleotide|base pair/i },
    { key: 'flower_structure', regex: /flower|stamen|carpel|anther|stigma|ovary/i },
    { key: 'prism_refraction', regex: /prism|refraction|angle of deviation|ray diagram/i },
    { key: 'circuit_diagram', regex: /circuit|ammeter|voltmeter|ohm's law|resistor/i },
    { key: 'wheatstone_bridge', regex: /wheatstone|bridge circuit|galvanometer/i },
    { key: 'galvanic_cell', regex: /galvanic|electrochemical cell|daniel cell|anode|cathode|salt bridge/i }
  ];

  let matchedKey = null;

  if (topicTag) {
    const directMatch = diagramKeyMap.find(d => d.key === topicTag || topicTag.includes(d.key));
    if (directMatch) matchedKey = directMatch.key;
  }

  if (!matchedKey) {
    const textMatch = diagramKeyMap.find(d => d.regex.test(stem));
    if (textMatch) matchedKey = textMatch.key;
  }

  // 1. Check if database has DiagramRegistry entry
  try {
    const dbDiagram = await prisma.diagramRegistry.findFirst({
      where: {
        isActive: true,
        OR: [
          matchedKey ? { tags: { has: matchedKey } } : {},
          { title: { contains: matchedKey || 'Diagram', mode: 'insensitive' } }
        ]
      }
    });

    if (dbDiagram && dbDiagram.imageUrl) {
      return dbDiagram.imageUrl;
    }
  } catch (err) {
    // Database query fallback
  }

  // 2. Return pre-defined vector SVG if matched
  if (matchedKey && SVG_DIAGRAMS[matchedKey]) {
    const svgData = SVG_DIAGRAMS[matchedKey].trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;
  }

  // 3. Fallback dynamic SVG generator if question explicitly demands a diagram
  const needsDiagram = /diagram|neat sketch|labeled figure|draw|structural diagram|anatomical|circuit|ray diagram/i.test(stem) || subjUpper.includes('BIOLOGY');

  if (needsDiagram) {
    const topicTitle = question.diagramTopic || (stem.split('?')[0].slice(0, 45) + ' Diagram');
    return generateDynamicSvgDiagram(topicTitle, subjectName, chapterName);
  }

  return null;
}

module.exports = {
  getOrAttachDiagram,
  generateDynamicSvgDiagram,
  SVG_DIAGRAMS
};
