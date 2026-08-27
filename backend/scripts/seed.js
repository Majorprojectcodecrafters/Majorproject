const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

const seed = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // 1. Create Admin User
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@school.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@school.com',
          password: hashedPassword,
          role: 'ADMIN',
          dob: new Date('1990-01-01')
        }
      });
      console.log('✅ Admin user created (admin@school.com)');
    } else {
      console.log('⏭️  Admin user already exists');
    }

    // 2. Create Teacher User
    const teacherExists = await prisma.user.findUnique({ where: { email: 'teacher@school.com' } });
    let teacherUser;
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      teacherUser = await prisma.user.create({
        data: {
          name: 'John Teacher',
          email: 'teacher@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          dob: new Date('1985-05-15'),
          teacher: {
            create: {
              education: 'M.Sc Physics, B.Ed',
              experienceYears: 10
            }
          }
        }
      });
      console.log('✅ Teacher user created (teacher@school.com)');
    } else {
      teacherUser = teacherExists;
      console.log('⏭️  Teacher user already exists');
    }

    // 3. Create Student User
    const studentExists = await prisma.user.findUnique({ where: { email: 'student@school.com' } });
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      await prisma.user.create({
        data: {
          name: 'Student User',
          email: 'student@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          dob: new Date('2007-08-10')
        }
      });
      console.log('✅ Student user created (student@school.com / student123)');
    } else {
      console.log('⏭️  Student user already exists');
    }

    // 4. Create Board
    let board = await prisma.board.findUnique({ where: { code: 'MSBSHSE' } });
    if (!board) {
      board = await prisma.board.create({
        data: {
          name: 'Maharashtra State Board',
          code: 'MSBSHSE'
        }
      });
      console.log('✅ Board created: Maharashtra State Board (MSBSHSE)');
    }

    // 4. Create Streams
    const streamNames = ['Science', 'Commerce', 'Arts'];
    const streamMap = {};
    for (const name of streamNames) {
      let stream = await prisma.stream.findFirst({ where: { name, boardId: board.id } });
      if (!stream) {
        stream = await prisma.stream.create({
          data: { name, boardId: board.id }
        });
      }
      streamMap[name] = stream;
    }
    console.log('✅ Streams created/verified (Science, Commerce, Arts)');

    const scienceStream = streamMap['Science'];

    // 5. Create Classes
    let class11 = await prisma.class.findFirst({
      where: { name: '11th Standard', academicYear: '2026-2027', streamId: scienceStream.id }
    });
    if (!class11) {
      class11 = await prisma.class.create({
        data: {
          name: '11th Standard',
          academicYear: '2026-2027',
          streamId: scienceStream.id,
          boardId: board.id
        }
      });
    }

    let class12 = await prisma.class.findFirst({
      where: { name: '12th Standard', academicYear: '2026-2027', streamId: scienceStream.id }
    });
    if (!class12) {
      class12 = await prisma.class.create({
        data: {
          name: '12th Standard',
          academicYear: '2026-2027',
          streamId: scienceStream.id,
          boardId: board.id
        }
      });
    }
    console.log('✅ Classes created/verified (11th Standard, 12th Standard)');

    // 6. Create Subjects for Science
    const subjectNames = ['Physics', 'Chemistry', 'Mathematics & Statistics', 'Biology'];
    const subjectMap = {};
    for (const name of subjectNames) {
      let subject = await prisma.subject.findFirst({
        where: { name, streamId: scienceStream.id }
      });
      if (!subject) {
        subject = await prisma.subject.create({
          data: { name, streamId: scienceStream.id }
        });
      }
      subjectMap[name] = subject;

      // Link to ClassSubject
      const cs11 = await prisma.classSubject.findFirst({
        where: { classId: class11.id, subjectId: subject.id }
      });
      if (!cs11) {
        await prisma.classSubject.create({ data: { classId: class11.id, subjectId: subject.id } });
      }

      const cs12 = await prisma.classSubject.findFirst({
        where: { classId: class12.id, subjectId: subject.id }
      });
      if (!cs12) {
        await prisma.classSubject.create({ data: { classId: class12.id, subjectId: subject.id } });
      }
    }
    console.log('✅ Subjects & ClassSubject relations linked');

    // =========================================================================
    // 7. SEED 12TH PHYSICS CURRICULUM, WEIGHTAGES & TOPICS
    // =========================================================================
    const physics = subjectMap['Physics'];
    const physicsChaptersData = [
      { no: 1, name: 'Rotational Dynamics', marks: 5, opt: 7, pStart: 1, pEnd: 25, topics: ['Circular Motion', 'Centripetal Force', 'Moment of Inertia', 'Radius of Gyration', 'Rolling Motion'] },
      { no: 2, name: 'Mechanical Properties of Fluids', marks: 5, opt: 7, pStart: 26, pEnd: 55, topics: ['Pressure', 'Surface Tension', 'Viscosity', 'Bernoulli Principle', 'Capillarity'] },
      { no: 3, name: 'Kinetic Theory of Gases and Radiation', marks: 5, opt: 7, pStart: 56, pEnd: 74, topics: ['Ideal Gas Laws', 'Mean Free Path', 'Black Body Radiation', 'Wien Displacement Law', 'Stefan Boltzmann Law'] },
      { no: 4, name: 'Thermodynamics', marks: 5, opt: 7, pStart: 75, pEnd: 108, topics: ['First Law of Thermodynamics', 'Isothermal Process', 'Adiabatic Process', 'Heat Engine', 'Refrigerators'] },
      { no: 5, name: 'Oscillations', marks: 4, opt: 5, pStart: 109, pEnd: 130, topics: ['Simple Harmonic Motion', 'Differential Equation of SHM', 'Simple Pendulum', 'Damped Oscillations'] },
      { no: 6, name: 'Superposition of Waves', marks: 4, opt: 6, pStart: 131, pEnd: 157, topics: ['Progressive Waves', 'Stationary Waves', 'Beats', 'Doppler Effect', 'Vibrations in Air Columns'] },
      { no: 7, name: 'Wave Optics', marks: 5, opt: 7, pStart: 158, pEnd: 185, topics: ['Huygens Principle', 'Interference', 'Young Double Slit Experiment', 'Diffraction', 'Polarization'] },
      { no: 8, name: 'Electrostatics', marks: 4, opt: 6, pStart: 186, pEnd: 213, topics: ['Gauss Theorem', 'Electric Potential', 'Capacitance', 'Van de Graaff Generator', 'Dielectrics'] },
      { no: 9, name: 'Current Electricity', marks: 4, opt: 6, pStart: 214, pEnd: 229, topics: ['Kirchhoff Laws', 'Wheatstone Bridge', 'Potentiometer', 'Meter Bridge'] },
      { no: 10, name: 'Magnetic Fields due to Electric Current', marks: 4, opt: 6, pStart: 230, pEnd: 250, topics: ['Biot Savart Law', 'Ampere Law', 'Cyclotron', 'Moving Coil Galvanometer'] },
      { no: 11, name: 'Magnetic Materials', marks: 4, opt: 5, pStart: 251, pEnd: 264, topics: ['Diamagnetism', 'Paramagnetism', 'Ferromagnetism', 'Hysteresis', 'Electromagnets'] },
      { no: 12, name: 'Electromagnetic Induction', marks: 5, opt: 7, pStart: 265, pEnd: 287, topics: ['Faraday Law', 'Lenz Law', 'Self Induction', 'Mutual Induction', 'Eddy Currents'] },
      { no: 13, name: 'AC Circuits', marks: 4, opt: 6, pStart: 288, pEnd: 305, topics: ['RMS Voltage', 'LC Resonance', 'Series LCR Circuit', 'Power in AC Circuit'] },
      { no: 14, name: 'Dual Nature of Radiation and Matter', marks: 4, opt: 5, pStart: 306, pEnd: 323, topics: ['Photoelectric Effect', 'Einstein Photoelectric Equation', 'de Broglie Wavelength', 'Davisson Germer Experiment'] },
      { no: 15, name: 'Structure of Atoms and Nuclei', marks: 4, opt: 6, pStart: 324, pEnd: 343, topics: ['Bohr Model', 'Hydrogen Spectrum', 'Nuclear Binding Energy', 'Radioactivity', 'Nuclear Fission & Fusion'] },
      { no: 16, name: 'Semiconductor Devices', marks: 4, opt: 5, pStart: 344, pEnd: 364, topics: ['p-n Junction Diode', 'Zener Diode', 'Solar Cell', 'LED', 'Logic Gates'] }
    ];

    for (const cData of physicsChaptersData) {
      let chapter = await prisma.chapter.findFirst({
        where: { name: cData.name, subjectId: physics.id }
      });
      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            chapterNo: cData.no,
            name: cData.name,
            subjectId: physics.id,
            pageStart: cData.pStart,
            pageEnd: cData.pEnd
          }
        });
      }

      // Weightage
      const wExists = await prisma.chapterWeightage.findFirst({
        where: { subjectId: physics.id, chapterId: chapter.id, classId: class12.id }
      });
      if (!wExists) {
        await prisma.chapterWeightage.create({
          data: {
            boardId: board.id,
            streamId: scienceStream.id,
            classId: class12.id,
            subjectId: physics.id,
            chapterId: chapter.id,
            marks: cData.marks,
            marksWithOption: cData.opt
          }
        });
      }

      // Topics
      for (const tName of cData.topics) {
        const tExists = await prisma.topic.findFirst({
          where: { name: tName, chapterId: chapter.id }
        });
        if (!tExists) {
          await prisma.topic.create({ data: { name: tName, chapterId: chapter.id } });
        }
      }
    }
    console.log('✅ 12th Physics chapters, topics, page ranges & weightage seeded (70m / 98m)');

    // =========================================================================
    // 8. SEED 12TH CHEMISTRY CURRICULUM, UNITS, WEIGHTAGES & TOPICS
    // =========================================================================
    const chemistry = subjectMap['Chemistry'];
    const chemistryUnitsData = [
      {
        unitName: 'Physical Chemistry',
        order: 1,
        chapters: [
          { no: 1, name: 'Solid State', marks: 3, opt: 5, topics: ['Crystal Lattices', 'Unit Cells', 'Packing Efficiency', 'Defects in Solids'] },
          { no: 2, name: 'Solutions', marks: 4, opt: 6, topics: ['Types of Solutions', 'Raoult Law', 'Colligative Properties', 'Osmotic Pressure'] },
          { no: 3, name: 'Ionic Equilibria', marks: 4, opt: 6, topics: ['Degree of Dissociation', 'Ostwald Dilution Law', 'pH Scale', 'Buffer Solutions', 'Solubility Product'] },
          { no: 4, name: 'Chemical Thermodynamics', marks: 6, opt: 8, topics: ['Enthalpy', 'Hess Law', 'Entropy', 'Gibbs Energy', 'Spontaneity'] },
          { no: 5, name: 'Electrochemistry', marks: 5, opt: 7, topics: ['Kohlrausch Law', 'Nernst Equation', 'Galvanic Cells', 'Corrosion', 'Standard Hydrogen Electrode'] },
          { no: 6, name: 'Chemical Kinetics', marks: 4, opt: 6, topics: ['Rate of Reaction', 'Order of Reaction', 'Arrhenius Equation', 'Pseudo First Order Reaction'] }
        ]
      },
      {
        unitName: 'Inorganic Chemistry',
        order: 2,
        chapters: [
          { no: 7, name: 'Elements of Group 16, 17 & 18', marks: 6, opt: 8, topics: ['Trends in Physical Properties', 'Oxoacids of Halogens', 'Interhalogen Compounds', 'Noble Gas Compounds'] },
          { no: 8, name: 'Transition & Inner Transition Elements', marks: 6, opt: 8, topics: ['Electronic Configuration', 'Lanthanoid Contraction', 'Actinoids', 'Potassium Dichromate & Permanganate'] },
          { no: 9, name: 'Coordination Compounds', marks: 5, opt: 7, topics: ['Werner Theory', 'IUPAC Nomenclature', 'Isomerism', 'Crystal Field Theory'] }
        ]
      },
      {
        unitName: 'Organic Chemistry',
        order: 3,
        chapters: [
          { no: 10, name: 'Halogen Derivatives', marks: 5, opt: 7, topics: ['SN1 and SN2 Mechanisms', 'Optical Activity', 'Haloarenes', 'Grignard Reagents'] },
          { no: 11, name: 'Alcohols, Phenols and Ethers', marks: 4, opt: 6, topics: ['Preparation of Phenols', 'Kolbe Reaction', 'Reimer Tiemann Reaction', 'Williamson Synthesis'] },
          { no: 12, name: 'Aldehydes, Ketones and Carboxylic Acids', marks: 6, opt: 8, topics: ['Nucleophilic Addition', 'Aldol Condensation', 'Cannizzaro Reaction', 'Acidity of Carboxylic Acids'] },
          { no: 13, name: 'Amines', marks: 3, opt: 4, topics: ['Basicity of Amines', 'Hofmann Bromamide Degradation', 'Diazonium Salts', 'Carbylamine Test'] }
        ]
      },
      {
        unitName: 'Applied Chemistry',
        order: 4,
        chapters: [
          { no: 14, name: 'Biomolecules', marks: 3, opt: 4, topics: ['Carbohydrates', 'Proteins & Amino Acids', 'Enzymes', 'Nucleic Acids'] },
          { no: 15, name: 'Introduction to Polymer Chemistry', marks: 3, opt: 4, topics: ['Addition Polymers', 'Condensation Polymers', 'Vulcanization of Rubber', 'Biodegradable Polymers'] },
          { no: 16, name: 'Green Chemistry and Nano Chemistry', marks: 3, opt: 4, topics: ['12 Principles of Green Chemistry', 'Nanoparticles Synthesis', 'Applications of Nanomaterials'] }
        ]
      }
    ];

    for (const uData of chemistryUnitsData) {
      let unit = await prisma.unit.findFirst({
        where: { name: uData.unitName, subjectId: chemistry.id }
      });
      if (!unit) {
        unit = await prisma.unit.create({
          data: { name: uData.unitName, order: uData.order, subjectId: chemistry.id }
        });
      }

      for (const cData of uData.chapters) {
        let chapter = await prisma.chapter.findFirst({
          where: { name: cData.name, subjectId: chemistry.id }
        });
        if (!chapter) {
          chapter = await prisma.chapter.create({
            data: {
              chapterNo: cData.no,
              name: cData.name,
              subjectId: chemistry.id,
              unitId: unit.id
            }
          });
        }

        const wExists = await prisma.chapterWeightage.findFirst({
          where: { subjectId: chemistry.id, chapterId: chapter.id, classId: class12.id }
        });
        if (!wExists) {
          await prisma.chapterWeightage.create({
            data: {
              boardId: board.id,
              streamId: scienceStream.id,
              classId: class12.id,
              subjectId: chemistry.id,
              unitId: unit.id,
              chapterId: chapter.id,
              marks: cData.marks,
              marksWithOption: cData.opt
            }
          });
        }

        for (const tName of cData.topics) {
          const tExists = await prisma.topic.findFirst({
            where: { name: tName, chapterId: chapter.id }
          });
          if (!tExists) {
            await prisma.topic.create({ data: { name: tName, chapterId: chapter.id } });
          }
        }
      }
    }
    console.log('✅ 12th Chemistry 4 Units, 16 chapters, topics & weightage seeded (70m / 98m)');

    // =========================================================================
    // 9. SEED 12TH MATHEMATICS & STATISTICS CURRICULUM, WEIGHTAGES & TOPICS
    // =========================================================================
    const maths = subjectMap['Mathematics & Statistics'];
    const mathsChaptersData = [
      { no: 1, name: 'Mathematical Logic', marks: 6, opt: 8, topics: ['Statements and Truth Values', 'Logical Connectives', 'Tautology and Contradiction', 'Switching Circuits'] },
      { no: 2, name: 'Matrices', marks: 4, opt: 6, topics: ['Elementary Transformations', 'Inverse of Matrix', 'Adjoint Method', 'Solving Linear Equations'] },
      { no: 3, name: 'Trigonometric Functions', marks: 8, opt: 10, topics: ['Trigonometric Equations', 'General Solutions', 'Sine and Cosine Rules', 'Inverse Trigonometric Functions'] },
      { no: 4, name: 'Pair of Straight Lines', marks: 4, opt: 6, topics: ['Combined Equation', 'Homogeneous Equation of Degree Two', 'Angle between Lines'] },
      { no: 5, name: 'Vectors', marks: 9, opt: 12, topics: ['Section Formula', 'Dot Product & Cross Product', 'Scalar Triple Product', 'Vector Triple Product'] },
      { no: 6, name: 'Line and Plane', marks: 7, opt: 10, topics: ['Vector Equation of Line', 'Cartesian Equation of Line', 'Distance between Parallel Lines', 'Equation of Plane'] },
      { no: 7, name: 'Linear Programming', marks: 2, opt: 4, topics: ['Formulation of LPP', 'Graphical Method', 'Feasible Region', 'Optimal Solution'] },
      { no: 8, name: 'Differentiation', marks: 7, opt: 9, topics: ['Derivatives of Composite Functions', 'Implicit Functions', 'Parametric Functions', 'Higher Order Derivatives'] },
      { no: 9, name: 'Applications of Derivatives', marks: 7, opt: 9, topics: ['Tangent and Normal', 'Increasing and Decreasing Functions', 'Maxima and Minima'] },
      { no: 10, name: 'Indefinite Integration', marks: 8, opt: 10, topics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions'] },
      { no: 11, name: 'Definite Integration', marks: 4, opt: 6, topics: ['Properties of Definite Integrals', 'Fundamental Theorem of Calculus'] },
      { no: 12, name: 'Application of Definite Integration', marks: 2, opt: 4, topics: ['Area under Curve', 'Area between Two Curves'] },
      { no: 13, name: 'Differential Equations', marks: 6, opt: 8, topics: ['Order and Degree', 'Formation of Differential Equation', 'Separable Variable Method', 'Linear Differential Equations'] },
      { no: 14, name: 'Probability Distributions', marks: 3, opt: 5, topics: ['Random Variable', 'Probability Mass Function', 'Expected Value and Variance'] },
      { no: 15, name: 'Binomial Distribution', marks: 3, opt: 5, topics: ['Bernoulli Trials', 'Binomial Distribution Formula', 'Mean and Variance'] }
    ];

    for (const cData of mathsChaptersData) {
      let chapter = await prisma.chapter.findFirst({
        where: { name: cData.name, subjectId: maths.id }
      });
      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: { chapterNo: cData.no, name: cData.name, subjectId: maths.id }
        });
      }

      const wExists = await prisma.chapterWeightage.findFirst({
        where: { subjectId: maths.id, chapterId: chapter.id, classId: class12.id }
      });
      if (!wExists) {
        await prisma.chapterWeightage.create({
          data: {
            boardId: board.id,
            streamId: scienceStream.id,
            classId: class12.id,
            subjectId: maths.id,
            chapterId: chapter.id,
            marks: cData.marks,
            marksWithOption: cData.opt
          }
        });
      }

      for (const tName of cData.topics) {
        const tExists = await prisma.topic.findFirst({
          where: { name: tName, chapterId: chapter.id }
        });
        if (!tExists) {
          await prisma.topic.create({ data: { name: tName, chapterId: chapter.id } });
        }
      }
    }
    console.log('✅ 12th Mathematics & Statistics 15 chapters, topics & weightage seeded (80m / 112m)');

    // =========================================================================
    // 10. SEED 12TH BIOLOGY CURRICULUM, UNITS, WEIGHTAGES & TOPICS
    // =========================================================================
    const biology = subjectMap['Biology'];
    const biologyUnitsData = [
      {
        unitName: 'Reproduction',
        order: 1,
        chapters: [
          { no: 1, name: 'Reproduction in Lower and Higher Plants', marks: 6, opt: 8, topics: ['Asexual Reproduction', 'Microsporogenesis', 'Megasporogenesis', 'Pollination', 'Double Fertilization'] },
          { no: 2, name: 'Reproduction in Lower and Higher Animals', marks: 6, opt: 8, topics: ['Human Male Reproductive System', 'Human Female Reproductive System', 'Gametogenesis', 'Menstrual Cycle', 'Embryonic Development'] }
        ]
      },
      {
        unitName: 'Genetics and Evolution',
        order: 2,
        chapters: [
          { no: 3, name: 'Inheritance and Variation', marks: 4, opt: 6, topics: ['Mendel Laws', 'Genetic Disorders', 'Sex Determination', 'Sex Linked Inheritance'] },
          { no: 4, name: 'Molecular Basis of Inheritance', marks: 4, opt: 6, topics: ['DNA Structure', 'DNA Replication', 'Transcription', 'Translation', 'Gene Regulation'] },
          { no: 5, name: 'Origin and Evolution of Life', marks: 4, opt: 6, topics: ['Origin of Life', 'Darwinism', 'Modern Synthetic Theory', 'Human Evolution'] }
        ]
      },
      {
        unitName: 'Physiology',
        order: 3,
        chapters: [
          { no: 6, name: 'Plant Water Relation', marks: 5, opt: 7, topics: ['Water Absorption', 'Transpiration', 'Stomatal Movement', 'Transport of Water'] },
          { no: 7, name: 'Plant Growth and Mineral Nutrition', marks: 5, opt: 7, topics: ['Plant Growth Regulators', 'Auxins', 'Gibberellins', 'Cytokinins', 'Mineral Nutrition'] },
          { no: 8, name: 'Respiration and Circulation', marks: 7, opt: 10, topics: ['Mechanism of Respiration', 'Human Heart', 'Blood Circulation', 'Electrocardiogram'] },
          { no: 9, name: 'Control and Co-ordination', marks: 8, opt: 11, topics: ['Central Nervous System', 'Reflex Action', 'Endocrine System', 'Hormones'] }
        ]
      },
      {
        unitName: 'Applied Biology',
        order: 4,
        chapters: [
          { no: 10, name: 'Human Health and Diseases', marks: 3, opt: 4, topics: ['Immune System', 'Vaccination', 'Cancer', 'AIDS', 'Common Human Diseases'] },
          { no: 11, name: 'Enhancement of Food Production', marks: 4, opt: 6, topics: ['Plant Breeding', 'Tissue Culture', 'Single Cell Protein', 'Microbes in Human Welfare'] },
          { no: 12, name: 'Biotechnology', marks: 5, opt: 7, topics: ['Recombinant DNA Technology', 'PCR', 'Transgenic Animals', 'Applications in Agriculture'] }
        ]
      },
      {
        unitName: 'Ecology and Environment',
        order: 5,
        chapters: [
          { no: 13, name: 'Organisms and Populations', marks: 3, opt: 4, topics: ['Organisms and Environment', 'Population Attributes', 'Population Growth'] },
          { no: 14, name: 'Ecosystems and Energy Flow', marks: 3, opt: 4, topics: ['Ecosystem Structure', 'Energy Flow', 'Ecological Pyramids', 'Nutrient Cycling'] },
          { no: 15, name: 'Biodiversity, Conservation and Environmental Issues', marks: 3, opt: 4, topics: ['Biodiversity Hotspots', 'In-situ and Ex-situ Conservation', 'Environmental Issues'] }
        ]
      }
    ];

    for (const uData of biologyUnitsData) {
      let unit = await prisma.unit.findFirst({
        where: { name: uData.unitName, subjectId: biology.id }
      });
      if (!unit) {
        unit = await prisma.unit.create({
          data: { name: uData.unitName, order: uData.order, subjectId: biology.id }
        });
      }

      for (const cData of uData.chapters) {
        let chapter = await prisma.chapter.findFirst({
          where: { name: cData.name, subjectId: biology.id }
        });
        if (!chapter) {
          chapter = await prisma.chapter.create({
            data: {
              chapterNo: cData.no,
              name: cData.name,
              subjectId: biology.id,
              unitId: unit.id
            }
          });
        }

        const wExists = await prisma.chapterWeightage.findFirst({
          where: { subjectId: biology.id, chapterId: chapter.id, classId: class12.id }
        });
        if (!wExists) {
          await prisma.chapterWeightage.create({
            data: {
              boardId: board.id,
              streamId: scienceStream.id,
              classId: class12.id,
              subjectId: biology.id,
              unitId: unit.id,
              chapterId: chapter.id,
              marks: cData.marks,
              marksWithOption: cData.opt
            }
          });
        }

        for (const tName of cData.topics) {
          const tExists = await prisma.topic.findFirst({
            where: { name: tName, chapterId: chapter.id }
          });
          if (!tExists) {
            await prisma.topic.create({ data: { name: tName, chapterId: chapter.id } });
          }
        }
      }
    }
    console.log('✅ 12th Biology 5 Units, 15 chapters, topics & weightage seeded (70m / 98m)');

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
