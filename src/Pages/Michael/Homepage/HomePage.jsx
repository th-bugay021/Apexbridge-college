    import './apexbridge.css';
    import possibilityImage from '../../../assets/possibility-image.png';
    import campusScience from '../../../assets/campus-science.jpg';
    import campusLibrary from '../../../assets/campus-library.jpg';
    import safeCampus from '../../../assets/safe-campus.jpg';
    import sportField from '../../../assets/sport-field.jpg';
    import campusLecture from '../../../assets/campus-lecture.jpg';
    import classroomHero from '../../../assets/apexbridge-classroom-hero.png';
    import studentHero from '../../../assets/apexbridge-student-hero.png';

    import { lazy, Suspense, useEffect, useRef, useState } from 'react';
    import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
    import { Link } from 'react-router-dom';
    import {
    ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, FlaskConical, LibraryBig,
    MapPinned, Menu, MoveUpRight, Quote, School, ShieldCheck, Sparkles, Trophy, UsersRound, X,
    } from 'lucide-react';

    const HeroAurora = lazy(() => import('./HeroAurora.jsx'));

    const navItems = [
    ['about', 'About'], ['programs', 'Programs'], ['campus', 'Campus'], ['admissions', 'Admissions'],
    ];

    const programs = [
    { id: 'nursery-primary', title: 'Nursery & Primary', stage: 'Ages 3 to 11', icon: BookOpen, summary: 'Play-led learning that builds reading, number sense, and curiosity.', detail: 'A gentle, purposeful start where children build confidence through play-led learning, reading, number sense, and curiosity.' },
    { id: 'junior-secondary', title: 'Junior Secondary', stage: 'JSS 1 to 3', icon: FlaskConical, summary: 'Core subjects, practical labs, and early career exploration.', detail: 'A broad foundation across core subjects, with practical labs and space for early career exploration.' },
    { id: 'senior-secondary', title: 'Senior Secondary', stage: 'SS 1 to 3', icon: UsersRound, summary: 'Science, Arts, and Commercial tracks with WAEC and NECO preparation.', detail: 'Focused pathways in Science, Arts, and Commercial tracks, with preparation for WAEC and NECO.' },
    { id: 'clubs-sports', title: 'Clubs & Sports', stage: 'After school', icon: Trophy, summary: 'Football, debate, coding, music, and more.', detail: 'Time beyond the classroom for football, debate, coding, music, and the interests that help students find their people.' },
    ];

    const campusPanels = [
    { id: 'science-labs', title: 'Science lab', text: 'Practical spaces support questions, discovery, and learning by doing.', icon: FlaskConical, tone: 'lab', image: campusScience, imageWidth: 1920, imageHeight: 1280 },
    { id: 'library', title: 'Library', text: 'A place to read, research, and follow a question further.', icon: LibraryBig, tone: 'library', image: campusLibrary, imageWidth: 1536, imageHeight: 1024 },
    { id: 'safety', title: 'Safe campus', text: 'Secure gates and trained staff.', icon: ShieldCheck, tone: 'safe', image: safeCampus, imageWidth: 1536, imageHeight: 1024 },
    { id: 'sports', title: 'Sports field', text: 'Room for football, movement, and team spirit.', icon: Trophy, tone: 'sport', image: sportField, imageWidth: 1920, imageHeight: 1371 },
    { id: 'campus-learning', title: 'Campus lecture', text: 'Hands-on learning every week.', icon: BookOpen, tone: 'lecture', image: campusLecture, imageWidth: 1448, imageHeight: 1086 },
    ];

    const trustPoints = [
    ['Small classes', UsersRound], ['Caring teachers', Sparkles], ['WAEC / NECO prep', BookOpen], ['Safe campus', ShieldCheck],
    ];

    const reveal = (reduced, delay = 0) => ({
    initial: reduced ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: reduced ? 0 : 0.55, delay: reduced ? 0 : delay, ease: 'easeOut' },
    });

    function Home() {
    const reducedMotion = useReducedMotion();
    const reduced = Boolean(reducedMotion);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('top');
    const [progress, setProgress] = useState(0);
    const [selectedProgram, setSelectedProgram] = useState(programs[0].id);
    const [expandedCampus, setExpandedCampus] = useState(null);
    const [formState, setFormState] = useState({ name: '', contact: '', stage: '', message: '' });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [auroraEnabled, setAuroraEnabled] = useState(false);
    const [activeHeroImage, setActiveHeroImage] = useState(0);
    const [loadedHeroImages, setLoadedHeroImages] = useState([false, false]);
    const menuButtonRef = useRef(null);
    const heroArtRef = useRef(null);
    const journeyRef = useRef(null);
    const [journeyVisible, setJourneyVisible] = useState(reduced);
    const { scrollY } = useScroll();
    const artY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 70]);

    useEffect(() => {
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateAuroraEligibility = () => setAuroraEnabled(window.innerWidth >= 768 && !motionPreference.matches);
        updateAuroraEligibility();
        window.addEventListener('resize', updateAuroraEligibility);
        motionPreference.addEventListener('change', updateAuroraEligibility);
        return () => {
            window.removeEventListener('resize', updateAuroraEligibility);
            motionPreference.removeEventListener('change', updateAuroraEligibility);
        };
    }, []);

    useEffect(() => {
        const section = journeyRef.current;
        if (!section) return undefined;
        if (reduced) return undefined;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setJourneyVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.3 });
        observer.observe(section);
        return () => observer.disconnect();
    }, [reduced]);

    useEffect(() => {
        const heroArt = heroArtRef.current;
        if (!heroArt || !loadedHeroImages.every(Boolean)) return undefined;

        let heroIsVisible = false;
        let tabIsVisible = !document.hidden;
        let intervalId;
        const stopSlideshow = () => {
            window.clearInterval(intervalId);
            intervalId = undefined;
        };
        const updateSlideshow = () => {
            if (heroIsVisible && tabIsVisible && intervalId === undefined) {
                intervalId = window.setInterval(() => {
                    setActiveHeroImage((current) => (current + 1) % 2);
                }, 5000);
            } else if ((!heroIsVisible || !tabIsVisible) && intervalId !== undefined) {
                stopSlideshow();
            }
        };
        const handleVisibilityChange = () => {
            tabIsVisible = !document.hidden;
            updateSlideshow();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        let observer;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(([entry]) => {
                heroIsVisible = entry.isIntersecting;
                updateSlideshow();
            });
            observer.observe(heroArt);
        } else {
            heroIsVisible = true;
            updateSlideshow();
        }

        return () => {
            stopSlideshow();
            observer?.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadedHeroImages]);

    useEffect(() => {
        const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
        setScrolled(window.scrollY > 24);
        };
        onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const sections = ['top', ...navItems.map(([id]) => id)];
        const observers = sections.map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveSection(id); }, { rootMargin: '-25% 0px -65% 0px' });
        observer.observe(element); return observer;
        });
        return () => observers.forEach((observer) => observer?.disconnect());
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (event) => { if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus(); } };
        window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);
    const validate = () => {
        const next = {};
        if (!formState.name.trim()) next.name = 'Please add your name.';
        if (!formState.contact.trim()) next.contact = 'Please add a phone number or email.';
        if (!formState.stage) next.stage = 'Please choose a child’s stage.';
        if (!formState.message.trim()) next.message = 'Please tell us how we can help.';
        setErrors(next); return Object.keys(next).length === 0;
    };
    const submit = (event) => { event.preventDefault(); if (validate()) { setIsSubmitting(true); setSubmitted(false); window.setTimeout(() => { setIsSubmitting(false); setSubmitted(true); }, reduced ? 0 : 500); } };
    const selected = programs.find((program) => program.id === selectedProgram) ?? programs[0];
    const SelectedIcon = selected.icon;

    return (
        <div className="site-shell">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
            <div className="scroll-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
            <div className="wrap header-inner">
            <a className="brand" href="#top" aria-label="Apexbridge College home" onClick={closeMenu} data-testid="link-home"><img src="/logo/apexbridge-primary-logo.png" alt="Apexbridge College" /></a>
            <button ref={menuButtonRef} className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)} data-testid="button-menu-toggle">{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
            <nav id="primary-navigation" className={`primary-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
                {navItems.map(([id, label]) => <a key={id} className={activeSection === id ? 'is-active' : ''} href={`#${id}`} onClick={closeMenu} data-testid={`link-${id}`}>{label}</a>)}
                <Link to="/login" onClick={closeMenu}>Sign in</Link>
                <a className="nav-apply" href="#contact" onClick={closeMenu} data-testid="link-contact">Get in touch <ArrowUpRight aria-hidden="true" size={15} /></a>
            </nav>
            </div>
        </header>

        <main id="main-content">
            <section id="top" className="hero" aria-labelledby="hero-title">
            {auroraEnabled && <Suspense fallback={null}><HeroAurora /></Suspense>}
            <div className="wrap hero-inner">
                <motion.div className="hero-copy" initial={reduced ? false : 'hidden'} animate="visible" transition={{ staggerChildren: reduced ? 0 : 0.12 }}>
                <motion.p className="eyebrow" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>A place to learn and grow</motion.p>
                <motion.h1 id="hero-title" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>Your child’s bridge to a <em>brighter future.</em></motion.h1>
                <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>Apexbridge College pairs small classes and caring teachers with the tools students need to reach university and beyond.</motion.p>
                <motion.div className="hero-actions" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}><a className="button button-primary" href="#admissions" data-testid="link-start-application">Explore admissions <ArrowRight aria-hidden="true" /></a><a className="button button-quiet" href="#campus" data-testid="link-visit-campus">Discover campus life</a></motion.div>
                </motion.div>
                <motion.div ref={heroArtRef} className="hero-art" aria-label="Apexbridge College campus photos" style={{ y: artY }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.2 }}>
                <div className="hero-art-stamp" aria-hidden="true"><span>Grow</span> with<br />purpose</div>
                <link rel="preload" as="image" href={studentHero} />
                <div className="illustration-frame" role="img" aria-label="Photos of the Apexbridge College campus">
                    <img className={`hero-slide${activeHeroImage === 0 ? ' is-active' : ''}`} src={classroomHero} alt="" width="330" height="282" loading="eager" decoding="async" onLoad={() => setLoadedHeroImages((loaded) => loaded[0] ? loaded : [true, loaded[1]])} />
                    <img className={`hero-slide${activeHeroImage === 1 ? ' is-active' : ''}`} src={studentHero} alt="" width="312" height="282" loading="eager" decoding="async" onLoad={() => setLoadedHeroImages((loaded) => loaded[1] ? loaded : [loaded[0], true])} />
                    {/* <div className="illustration-label"><MapPinned aria-hidden="true" /> Local illustration · replaceable</div> */}
                </div>
                {/* <p className="hero-art-note">A warm visual stand-in until an approved photograph of the school is available.</p> */}
                </motion.div>
            </div>
            <a className="scroll-cue" href="#about" aria-label="Scroll to about section"><span>Scroll to explore</span><ChevronDown aria-hidden="true" /></a>
            </section>

            <section ref={journeyRef} className={'journey-section' + (journeyVisible ? ' is-visible' : '')} aria-label="Learning stages"><div className="wrap journey-content"><div className="journey-top"><p className="journey-intro">One learning journey, from first questions to future plans.</p><div className="journey-stepper"><span className="journey-line" aria-hidden="true" /><div className="journey-stage" tabIndex={0}><span className="journey-circle">01</span><span className="journey-stage-copy"><strong>Discover</strong><small>Nursery &amp; Primary</small></span></div><div className="journey-stage" tabIndex={0}><span className="journey-circle">02</span><span className="journey-stage-copy"><strong>Explore</strong><small>Junior Secondary</small></span></div><div className="journey-stage" tabIndex={0}><span className="journey-circle">03</span><span className="journey-stage-copy"><strong>Prepare</strong><small>Senior Secondary</small></span></div></div></div><div className="journey-trust" aria-label="Why families choose Apexbridge">{trustPoints.map(([label, Icon]) => <div className="journey-trust-item" key={label}><Icon aria-hidden="true" /><span>{label}</span></div>)}</div></div></section>

            <motion.section id="about" className="wrap about-section" aria-labelledby="about-title" {...reveal(reduced)}><div className="about-art" role="img" aria-label="A teacher helping a student in a classroom"><img className="about-art-photo" src={possibilityImage} alt="A teacher helping a student in a classroom" width={1402} height={1122} loading="lazy" decoding="async" /><span className="about-marker"><School aria-hidden="true" /> A bridge to possibility</span><div className="about-arch" /></div><div className="about-copy"><p className="eyebrow">A school that sees the whole student</p><h2 id="about-title" className="section-heading">A school that knows every student by name.</h2><p>At Apexbridge College, learning is personal. Small classes and caring teachers help children build confidence, find their curiosity, and prepare for the opportunities ahead.</p><p className="edit-note"><strong>School story to add:</strong> Replace this editable introduction with the principal’s approved words about the school’s story, mission, and what parents can expect.</p><div className="principle-line">A strong foundation for every next step</div></div></motion.section>

            <section id="programs" className="programs-section" aria-labelledby="programs-title"><div className="wrap"><motion.div className="programs-top" {...reveal(reduced)}><div><p className="eyebrow">Learning at every stage</p><h2 id="programs-title" className="section-heading">Programs for every stage.</h2></div><p className="section-intro">From first discoveries to focused pathways, each stage makes room for new skills, questions, and ambitions.</p></motion.div><div className="program-explorer"><div className="program-tabs" role="tablist" aria-label="Explore programs">{programs.map((program) => { const Icon = program.icon; return <button key={program.id} data-testid={`program-${program.id}`} className={selectedProgram === program.id ? 'is-selected' : ''} role="tab" aria-selected={selectedProgram === program.id} aria-controls={`panel-${program.id}`} onClick={() => setSelectedProgram(program.id)}><Icon aria-hidden="true" /><span>{program.title}</span></button>; })}</div><motion.div key={selected.id} className="program-detail" id={`panel-${selected.id}`} role="tabpanel" {...reveal(reduced)}><div className="detail-icon"><SelectedIcon aria-hidden="true" /></div><div><p className="eyebrow">{selected.stage}</p><h3>{selected.title}</h3><p>{selected.detail}</p><a href="#contact" className="text-link">Ask about this stage <ArrowRight aria-hidden="true" /></a></div></motion.div></div><p className="program-note">Program descriptions reflect the information supplied for this page. Please confirm current details with the school.</p></div></section>

            <section id="campus" className="wrap campus-section" aria-labelledby="campus-title"><motion.div className="campus-header" {...reveal(reduced)}><div><p className="eyebrow">A place to belong</p><h2 id="campus-title" className="section-heading">Life at Apexbridge.</h2></div><p className="section-intro">Space to read, experiment, play, and learn together. Replace these visual stand-ins with verified campus photographs when available.</p></motion.div><div className="campus-grid">{campusPanels.map((panel, index) => { const Icon = panel.icon; const expanded = expandedCampus === panel.id; return <motion.button type="button" className={`campus-panel campus-panel--${panel.tone}${expanded ? ' is-expanded' : ''}`} key={panel.id} onClick={() => setExpandedCampus(expanded ? null : panel.id)} data-testid={`campus-${panel.id}`} aria-expanded={expanded} {...reveal(reduced, index * .05)}><img className="campus-panel-image" src={panel.image} alt="" width={panel.imageWidth} height={panel.imageHeight} loading="lazy" decoding="async" /><Icon className="campus-decoration" aria-hidden="true" /><span className="campus-panel-copy"><span className="campus-panel-title">{panel.title}</span><span className="campus-panel-text">{panel.text}</span>{expanded && <span className="campus-expanded"><MoveUpRight aria-hidden="true" /> Open slot for an approved photograph and fuller campus detail.</span>}</span></motion.button>; })}</div></section>

            <section id="admissions" className="admissions-section" aria-labelledby="admissions-title"><div className="wrap admissions-inner"><motion.div {...reveal(reduced)}><p className="eyebrow">Your next step</p><h2 id="admissions-title" className="section-heading">Come and see what learning can open up.</h2><p>Ask the school about current admissions, entry requirements, and how to arrange a visit.</p></motion.div><a className="button" href="#contact" data-testid="link-admissions-enquiry">Admissions enquiries <ArrowRight aria-hidden="true" /></a></div><div className="wrap admission-steps" aria-label="Admissions process">{[['01', 'Enquire', 'Start a conversation.'], ['02', 'Visit', 'See the learning environment.'], ['03', 'Apply', 'Ask about the next steps.'], ['04', 'Welcome', 'Begin the journey together.']].map(([number, title, text], index) => <motion.div className="admission-step" key={title} {...reveal(reduced, index * .08)}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></motion.div>)}</div></section>

            <section id="enquiry" className="enquiry-section" aria-labelledby="enquiry-title"><div className="wrap enquiry-grid"><motion.div {...reveal(reduced)}><p className="eyebrow">A simple first step</p><h2 id="enquiry-title" className="section-heading">Tell us what you’re looking for.</h2><p>Share a few details and the school can follow up through its verified channels.</p><div className="enquiry-aside"><Quote aria-hidden="true" /><span>We’ll keep your message here until it can connect to the school’s verified enquiry channel.</span></div></motion.div><motion.form className="enquiry-form" onSubmit={submit} noValidate {...reveal(reduced, .1)}>{submitted ? <div className="success-message" role="status"><span className="success-icon"><Check aria-hidden="true" /></span><h3>Thank you for reaching out.</h3><p>Your enquiry is ready for the school team. Add a verified form endpoint before publishing so messages can be received.</p><button type="button" className="text-link" onClick={() => { setSubmitted(false); setFormState({ name: '', contact: '', stage: '', message: '' }); }}>Send another enquiry <ArrowRight aria-hidden="true" /></button></div> : <><div className="form-field"><label htmlFor="enquiry-name">Your name</label><input id="enquiry-name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'error-name' : undefined} placeholder="e.g. Ada Okafor" />{errors.name && <span className="field-error" id="error-name">{errors.name}</span>}</div><div className="form-field"><label htmlFor="enquiry-contact">Phone or email</label><input id="enquiry-contact" value={formState.contact} onChange={(e) => setFormState({ ...formState, contact: e.target.value })} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? 'error-contact' : undefined} placeholder="[Add preferred contact]" />{errors.contact && <span className="field-error" id="error-contact">{errors.contact}</span>}</div><div className="form-field"><label htmlFor="enquiry-stage">Child’s stage</label><select id="enquiry-stage" value={formState.stage} onChange={(e) => setFormState({ ...formState, stage: e.target.value })} aria-invalid={Boolean(errors.stage)}><option value="">Select a stage</option><option>Nursery &amp; Primary</option><option>Junior Secondary</option><option>Senior Secondary</option><option>Clubs &amp; Sports</option></select>{errors.stage && <span className="field-error">{errors.stage}</span>}</div><div className="form-field"><label htmlFor="enquiry-message">How can we help?</label><textarea id="enquiry-message" rows={4} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} aria-invalid={Boolean(errors.message)} placeholder="Tell us about your question or campus visit." />{errors.message && <span className="field-error">{errors.message}</span>}</div><button className="button button-primary form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending enquiry…' : 'Send enquiry'} {!isSubmitting && <ArrowRight aria-hidden="true" />}</button></>}</motion.form></div></section>

            <section id="contact" className="contact-section" aria-labelledby="contact-title"><div className="wrap contact-grid"><motion.div {...reveal(reduced)}><p className="eyebrow">Start a conversation</p><h2 id="contact-title" className="section-heading">We’d be glad to hear from you.</h2></motion.div><motion.div {...reveal(reduced, .1)}><p className="contact-copy">For current admissions information or to ask about a campus visit, contact Apexbridge College directly using its verified school channels.</p><div className="contact-placeholder" data-testid="notice-contact-details"><strong>School contact details needed</strong>Add the verified address, telephone number, and admissions email here before publishing. No contact details were supplied for this page.</div></motion.div></div><div className="wrap contact-columns"><div><strong>Admissions</strong><span>[Add verified admissions email]</span></div><div><strong>Visit</strong><span>[Add verified school address]</span></div><div><strong>Call</strong><span>[Add verified phone number]</span></div></div><div className="wrap site-footer"><a className="brand" href="#top" aria-label="Apexbridge College, back to top" data-testid="link-footer-home"><img src="/logo/apexbridge-primary-logo.png" alt="Apexbridge College" /></a><span>© {new Date().getFullYear()} Apexbridge College</span><a className="back-to-top" href="#top" data-testid="link-back-to-top">Back to top ↑</a></div></section>
        </main>
        </div>
    );
    }

    export default function App() { return <Home />; }
