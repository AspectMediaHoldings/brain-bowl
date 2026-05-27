import { useState } from 'react';
import { supabase } from '../lib/supabase';

const FLORIDA_SCHOOLS = {
  'Alachua': { hs: ['Buchholz', 'Eastside', 'Gainesville', 'Hawthorne', 'Newberry', 'P.K. Yonge'], ms: ['Brentwood', 'Fort Clarke', 'Kanapaha', 'Lincoln', 'Oak Hall School'] },
  'Baker': { hs: ['Baker County'], ms: ['Baker County Middle'] },
  'Bay': { hs: ['Arnold', 'Bay', 'Bozeman', 'Mosley', 'Rutherford'], ms: ['Breakfast Point Academy', 'Merritt Brown', 'Mowat'] },
  'Bradford': { hs: ['Bradford'], ms: ['Bradford Middle'] },
  'Brevard': { hs: ['Cocoa', 'Eau Gallie', 'Edgewood', 'Heritage', 'Holy Trinity Episcopal', 'Melbourne', 'Merritt Island', 'Palm Bay', 'Rockledge', 'Satellite', 'Titusville', 'Viera', 'West Shore'], ms: ['Astronaut', 'DeLaura', 'Jefferson', 'Kennedy', 'McNair', 'Stone', 'Williams'] },
  'Broward': { hs: ['Coral Glades', 'Coral Springs', 'Cypress Bay', 'Dillard', 'Flanagan', 'Fort Lauderdale', 'Hallandale', 'Hollywood Hills', 'Monarch', 'Nova', 'Pembroke Pines Charter', 'Pine Crest', 'Plantation', 'Pompano Beach', 'South Broward', 'Stranahan', 'Western'], ms: ['Attucks', 'Crystal Lake', 'Driftwood', 'Forest Glen', 'Indian Ridge', 'Margate', 'McNab', 'Pompano Beach Middle', 'Ramblewood', 'Sawgrass Springs', 'Westpine'] },
  'Charlotte': { hs: ['Charlotte', 'Lemon Bay', 'Port Charlotte'], ms: ['Murdock', 'Port Charlotte Middle', 'Punta Gorda Middle'] },
  'Citrus': { hs: ['Citrus', 'Crystal River', 'Lecanto'], ms: ['Central Ridge', 'Citrus Springs', 'Crystal River Middle', 'Lecanto Middle'] },
  'Clay': { hs: ['Clay', 'Fleming Island', 'Middleburg', 'Orange Park', 'Ridgeview'], ms: ['Green Cove Springs', 'Lake Asbury', 'Lakeside', 'Oakleaf Village', 'Orange Park Middle'] },
  'Collier': { hs: ['Barron Collier', 'Community School of Naples', 'Golden Gate', 'Gulf Coast', 'Immokalee', 'Lely', 'Naples', 'Palmetto Ridge'], ms: ['East Naples', 'Golden Gate Middle', 'Gulfview', 'Manatee', 'North Naples', 'Oakridge'] },
  'Columbia': { hs: ['Columbia', 'Fort White'], ms: ['Fort White Middle', 'Richardson'] },
  'DeSoto': { hs: ['DeSoto County'], ms: ['DeSoto Middle'] },
  'Dixie': { hs: ['Dixie County'], ms: ['Dixie Middle'] },
  'Duval': { hs: ['Andrew Jackson', 'Atlantic Coast', 'Bishop Kenny', 'Bolles School', 'Douglas Anderson', 'Ed White', 'Episcopal', 'First Coast', 'Fletcher', 'Forrest', 'Mandarin', 'Paxon', 'Providence', 'Ribault', 'Sandalwood', 'Stanton', 'Terry Parker', 'Westside'], ms: ['Alfred Dupont', 'Biscayne', 'Central Riverside', 'Crown Point', 'Duncan Fletcher', 'Highlands', 'Jacksonville Beach', 'Lake Shore', 'Landmark', 'Matthew Gilbert', 'Southside', 'Stillwater'] },
  'Escambia': { hs: ['Booker T. Washington', 'Catholic', 'Escambia', 'Gulf Breeze', 'Milton', 'Navarre', 'Pensacola', 'Pine Forest', 'Tate', 'West Florida'], ms: ['Beulah', 'Bellview', 'Ferry Pass', 'Kingsfield', 'Lincoln Park', 'Montclair', 'Ransom', 'Workman'] },
  'Flagler': { hs: ['Flagler Palm Coast', 'Matanzas'], ms: ['Buddy Taylor', 'Indian Trails'] },
  'Franklin': { hs: ['Franklin County'], ms: ['Franklin County Middle'] },
  'Gadsden': { hs: ['Gadsden County', 'Havana Northside'], ms: ['Greensboro', 'Havana Middle', 'West Gadsden Middle'] },
  'Gilchrist': { hs: ['Gilchrist County'], ms: ['Trenton Middle'] },
  'Glades': { hs: ['Moore Haven'], ms: ['Glades Middle'] },
  'Gulf': { hs: ['Port St. Joe'], ms: ['Gulf Middle'] },
  'Hamilton': { hs: ['Hamilton County'], ms: ['Hamilton County Middle'] },
  'Hardee': { hs: ['Hardee'], ms: ['Hardee Middle'] },
  'Hendry': { hs: ['Clewiston', 'LaBelle'], ms: ['Clewiston Middle', 'LaBelle Middle'] },
  'Hernando': { hs: ['Central', 'Nature Coast Tech', 'Springstead', 'Weeki Wachee'], ms: ['Challenger K8', 'Fox Chapel', 'Parrott Middle', 'Powell Middle'] },
  'Highlands': { hs: ['Avon Park', 'Lake Placid', 'Sebring'], ms: ['Hill-Gustat', 'Memorial'] },
  'Hillsborough': { hs: ['Alonso', 'Armwood', 'Blake', 'Brandon', 'Brooks DeBartolo Collegiate', 'Chamberlain', 'Durant', 'East Bay', 'Freedom', 'Gaither', 'Hillsborough', 'Jefferson', 'Jesuit', 'King', 'Lennard', 'Leto', 'Middleton', 'Mitchell', 'Plant', 'Plant City', 'Riverview', 'Robinson', 'Sickles', 'Spoto', 'Steinbrenner', 'Strawberry Crest', 'Tampa Bay Tech', 'Tampa Catholic', 'Tampa Prep', 'Wharton', 'Wiregrass Ranch'], ms: ['Adams', 'Barrington', 'Burnett', 'Burns', 'Cannella', 'Davidsen', 'Dowdell', 'Eisenhower', 'Ferrell', 'Franklin', 'Giunta', 'Greco', 'Hill', 'Jennings', 'Liberty', 'McLane', 'Monroe', 'Noto', 'Pierce', 'Randall', 'Rampello', 'Roland Park', 'Shields', 'Sligh', 'Smith', 'Stewart', 'Tomlin'] },
  'Holmes': { hs: ['Holmes County'], ms: ['Bonifay Middle', 'Ponce de Leon Middle'] },
  'Indian River': { hs: ['IRMA', 'Sebastian River', "St. Edward's", 'Vero Beach'], ms: ['Gifford', 'Oslo', 'Storm Grove', 'Treasure Coast Middle'] },
  'Jackson': { hs: ['Cottondale', 'Marianna', 'Sneads'], ms: ['Grand Ridge', 'Marianna Middle'] },
  'Jefferson': { hs: ['Jefferson County'], ms: ['Jefferson Middle'] },
  'Lafayette': { hs: ['Lafayette'], ms: ['Lafayette Middle'] },
  'Lake': { hs: ['East Ridge', 'Eustis', 'Lake Minneola', 'Leesburg', 'Mount Dora', 'Mount Dora Christian Academy', 'South Lake', 'Tavares', 'Umatilla'], ms: ['Carver', 'Cecil Gray', 'East Ridge Middle', 'Eustis Middle', 'Tavares Middle'] },
  'Lee': { hs: ['Bonita Springs', 'Cape Coral', 'Cypress Lake', 'East Lee County', 'Estero', 'Fort Myers', 'Gateway', 'Island Coast', 'Lehigh Senior', 'Mariner', 'North Fort Myers', 'Riverdale', 'South Fort Myers'], ms: ['Bonita Springs Middle', 'Cape Coral Middle', 'Diplomat', 'Harns Marsh', 'Lehigh Acres Middle', 'Mariner Middle', 'Oak Hammock Creek', 'Sunshine'] },
  'Leon': { hs: ['Chiles', 'Florida High', 'Godby', 'Leon', 'Lincoln', 'Maclay School', 'Rickards', 'Tallahassee Classical'], ms: ['Cobb', 'Deerlake', 'Griffin', 'Hawks Rise', 'Lawton Chiles Middle', 'Montford', 'Swift Creek'] },
  'Levy': { hs: ['Bronson', 'Chiefland', 'Williston'], ms: ['Chiefland Middle', 'Williston Middle'] },
  'Liberty': { hs: ['Liberty County'], ms: ['Liberty Middle'] },
  'Madison': { hs: ['Madison County'], ms: ['Madison Middle'] },
  'Manatee': { hs: ['Bayshore', 'Braden River', 'Cardinal Mooney', 'Lakewood Ranch', 'Manatee', 'Southeast'], ms: ['Braden River Middle', 'Buffalo Creek', 'Carlos E. Haile', 'Hillside', 'Lincoln Middle', 'W.D. Sugg'] },
  'Marion': { hs: ['Belleview', 'Dunnellon', 'Forest', 'Lake Weir', 'North Marion', 'Vanguard', 'West Port'], ms: ['Belleview Middle', 'Fort King', 'Howard', 'Lake Weir Middle', 'Liberty Middle', 'North Marion Middle', 'Osceola'] },
  'Martin': { hs: ['Jensen Beach', 'Martin County', 'South Fork', 'Treasure Coast'], ms: ['Hidden Oaks', 'Indiantown', 'Murray'] },
  'Miami-Dade': { hs: ['Coral Gables', 'Coral Reef', 'Design & Architecture Senior', 'Hialeah', 'Miami Beach Senior', 'Miami Coral Park', 'Miami Jackson', 'Miami Palmetto', 'Miami Senior', 'Miami Springs Senior', 'North Miami Beach Senior', 'Ransom Everglades', 'South Miami Senior', 'Sunset Senior'], ms: ['Arvida', 'Hammocks', 'Kinloch Park', 'Miami Springs Middle', 'Nautilus', 'North Miami', 'Ponce De Leon', 'Ruben Dario', 'Shenandoah', 'South Miami', 'West Miami'] },
  'Monroe': { hs: ['Coral Shores', 'Key West', 'Marathon'], ms: ["Horace O'Bryant", 'Marathon Middle', 'Stanley Switlik'] },
  'Nassau': { hs: ['Fernandina Beach', 'Hilliard', 'West Nassau County', 'Yulee'], ms: ['Callahan', 'Fernandina Beach Middle', 'Yulee Middle'] },
  'Okaloosa': { hs: ['Baker', 'Choctawhatchee', 'Crestview', 'Fort Walton Beach', 'Niceville'], ms: ['Baker Middle', 'Crestview Middle', 'Davidson', 'Lewis', 'Meigs', 'Ruckel'] },
  'Okeechobee': { hs: ['Okeechobee'], ms: ['Osceola Middle'] },
  'Orange': { hs: ['Apopka', 'Bishop Moore', 'Boone', 'Colonial', 'Dr. Phillips', 'Edgewater', 'Evans', 'Foundation Academy', 'Hagerty', 'Jones', 'Lake Highland Preparatory', 'Olympia', 'Ocoee', 'University', 'Wekiva', 'West Orange', 'Winter Park'], ms: ['Arbor Ridge', 'Carver Middle', 'Chain of Lakes', 'Delaney Park', 'Discovery', 'Glenridge', 'Howard', 'Jackson', 'John Young', 'Kaley', 'Meadowbrook', 'Piedmont Lakes', 'Southwest', 'Walker', 'Westridge'] },
  'Osceola': { hs: ['Celebration', 'Harmony', 'Heritage', 'Liberty', 'Osceola', 'Poinciana', 'St. Cloud', 'Tohopekaliga'], ms: ['Canoe Creek', 'Denn John', 'Discovery Intermediate', 'Horizon', 'Kissimmee', 'Neptune', 'Parkway', 'St. Cloud Middle'] },
  'Palm Beach': { hs: ['Atlantic Community', 'Boca Raton Community', 'Boynton Beach Community', 'Cardinal Newman', 'Dwyer', 'Forest Hill Community', 'Jupiter', 'Lake Worth Community', 'Palm Beach Central', 'Palm Beach Gardens', 'Palm Beach Lakes', 'Park Vista Community', 'Royal Palm Beach', 'Santaluces Community', 'Spanish River Community', 'Suncoast Community', 'Wellington Community', 'West Boca Raton Community'], ms: ['Bak', 'Bear Lakes', 'Carver', 'Conniston', 'Eagles Landing', 'Glades', 'Howell Watkins', 'Independence', 'Jupiter Middle', 'Lake Worth Middle', 'Okeeheelee', 'Polo Park', 'Roosevelt', 'Timber Trace', 'Watson B. Duncan'] },
  'Pasco': { hs: ['Anclote', 'Cypress Creek', 'Fivay', 'Gulf', 'Hudson', 'Land O Lakes', 'Mitchell', 'New Port Richey', 'Pasco', 'River Ridge', 'Sunlake', 'Wesley Chapel', 'Wiregrass Ranch', 'Zephyrhills'], ms: ['Bayonet Point', 'Charles S. Rushe', 'Crews Lake', 'Fox Hollow', 'Gulf Middle', 'Hudson Middle', 'Pasco Middle', 'Pine View', 'River Ridge Middle', 'Thomas E. Weightman'] },
  'Pinellas': { hs: ['Admiral Farragut Academy', 'Boca Ciega', 'Clearwater', 'Countryside', 'Dixie Hollins', 'Dunedin', 'East Lake', 'Gibbs', 'Indian Rocks Christian', 'Lakewood', 'Largo', 'Northeast', 'Osceola', 'Palm Harbor University', 'Pinellas Park', 'Safety Harbor', 'Seminole', 'St. Petersburg', 'St. Petersburg Catholic', 'Tarpon Springs'], ms: ['Azalea', 'Clearwater Fundamental', 'Dunedin Highland', 'Fitzgerald', 'Largo Middle', 'Meadowlawn', 'Mease', 'Oak Grove', 'Palm Harbor', 'Pinellas Park Middle', 'Safety Harbor Middle', 'Seminole Middle', 'Tarpon Springs Middle'] },
  'Polk': { hs: ['Auburndale', 'Bartow', 'Davenport', 'George Jenkins', 'Haines City', 'Kathleen', 'Lake Gibson', 'Lake Region', 'Lake Wales', 'Lakeland', 'Lakeland Christian', 'McKeel Academy', 'Mulberry', 'Ridge Community', 'Winter Haven'], ms: ['Bartow Middle', 'Crystal Lake', 'Dundee Ridge', 'Fort Meade Middle', 'Haines City Middle', 'Lake Alfred-Addair', 'Lake Gibson Middle', 'Lakeland Highlands', 'Mulberry Middle', 'Sleepy Hill', 'Westwood', 'Winter Haven Middle'] },
  'Putnam': { hs: ['Crescent City', 'Interlachen', 'Palatka'], ms: ['C.H. Price Middle', 'Melrose', 'Q.I. Roberts'] },
  'Santa Rosa': { hs: ['Central', 'Gulf Breeze', 'Jay', 'Milton', 'Navarre', 'Pace'], ms: ['Avalon', 'Gulf Breeze Middle', 'Hobbs Middle', 'King Middle', 'Oriole Beach', 'S.S. Dixon'] },
  'Sarasota': { hs: ['Booker', 'Cardinal Mooney', 'North Port', 'Out-of-Door Academy', 'Pine View', 'Riverview', 'Sarasota', 'Venice'], ms: ['Booker Middle', 'Brookside', 'Heron Creek', 'McIntosh', 'Oak Park', 'Sarasota Middle', 'Venice Area'] },
  'Seminole': { hs: ['Crooms Academy', 'Lake Brantley', 'Lake Howell', 'Lake Mary', 'Lake Mary Preparatory', 'Lyman', 'Oviedo', 'Sanford', 'Seminole', 'Winter Springs'], ms: ['Belgrade', 'Chiles', 'Crystal Lake', 'Greenwood Lakes', 'Indian Trails', 'Jackson Heights', 'Lawton Chiles Middle', 'Millennium', 'Milwee', 'Rock Lake', 'South Seminole', 'Tuskawilla', 'Walker'] },
  'St. Johns': { hs: ['Allen D. Nease', 'Creekside', 'First Coast Christian', 'Ketterlinus', 'Menendez', 'Ponte Vedra', 'St. Augustine', 'St. Johns Country Day'], ms: ['Alice B. Landrum', 'Gamble Rogers', 'Patriot Oaks Academy', 'Sebastian Middle', 'Switzerland Point'] },
  'St. Lucie': { hs: ['Fort Pierce Central', 'Fort Pierce Westwood', 'Lincoln Park Academy', 'Port St. Lucie', 'St. Lucie West Centennial', 'Treasure Coast'], ms: ['Dan McCarty', 'Fairlawn', 'Forest Grove', 'Manatee Middle', 'Oak Hammock', 'Southern Oaks'] },
  'Sumter': { hs: ['South Sumter', 'Wildwood'], ms: ['South Sumter Middle', 'Wildwood Middle'] },
  'Suwannee': { hs: ['Branford', 'Suwannee'], ms: ['Branford Middle', 'Suwannee Middle'] },
  'Taylor': { hs: ['Taylor County'], ms: ['Taylor County Middle'] },
  'Union': { hs: ['Union County'], ms: ['Union County Middle'] },
  'Volusia': { hs: ['Atlantic', 'DeLand', 'Deltona', 'Mainland', 'Matanzas', 'New Smyrna Beach', 'Pine Ridge', 'Seabreeze', 'Spruce Creek', 'University High'], ms: ['Campbell', 'David C. Hinson', 'DeLand Middle', 'Heritage Middle', 'Horizon Middle', 'New Smyrna Beach Middle', 'Ormond Beach Middle', 'Silver Sands', 'T. DeWitt Taylor'] },
  'Wakulla': { hs: ['Wakulla'], ms: ['Wakulla Middle'] },
  'Walton': { hs: ['Freeport', 'South Walton', 'Walton'], ms: ['Emerald Coast', 'Freeport Middle', 'Walton Middle'] },
  'Washington': { hs: ['Chipley', 'Vernon'], ms: ['Chipley Middle', 'Vernon Middle'] },
};

const COUNTIES = Object.keys(FLORIDA_SCHOOLS).sort();
const POSITIONS = ['Head Coach', 'Assistant Coach', 'Faculty Advisor', 'Club Sponsor', 'Teacher'];

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 680, margin: '0 auto', padding: '32px 20px' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 24, marginBottom: 16 },
  h2: { color: '#C9A227', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 },
  label: { fontSize: 11, color: '#6b7084', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase', display: 'block' },
  inp: { padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 5, color: '#e8e6e1', outline: 'none', width: '100%', boxSizing: 'border-box' },
  err: { background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#e74c3c', marginBottom: 12 },
  ok: { background: '#1a2e1a', border: '1px solid #27ae60', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#27ae60', marginBottom: 12 },
};

function btn(c = '#C9A227', ghost = false) {
  return { padding: '10px 20px', fontSize: 13, fontWeight: 700, border: ghost ? `1px solid ${c}` : 'none', borderRadius: 5, background: ghost ? 'transparent' : c, color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 };
}

export default function CoachApplicationForm({ user, onBack }) {
  const [form, setForm] = useState({ full_name: '', phone: '', county: '', school_name: '', school_name_manual: '', position: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const countyData = FLORIDA_SCHOOLS[form.county];
  const schoolOptions = countyData
    ? [
        ...countyData.hs.map(s => ({ label: `${s} (High School)`, value: s })),
        ...countyData.ms.map(s => ({ label: `${s} (Middle School)`, value: s })),
        { label: 'My school is not listed', value: '__manual__' },
      ]
    : [];

  function setField(key, val) {
    if (key === 'county') {
      setForm(f => ({ ...f, county: val, school_name: '', school_name_manual: '' }));
    } else {
      setForm(f => ({ ...f, [key]: val }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { setMsg({ type: 'err', text: 'Full name required.' }); return; }
    if (!form.county) { setMsg({ type: 'err', text: 'Select a county.' }); return; }
    if (!form.school_name) { setMsg({ type: 'err', text: 'Select a school.' }); return; }
    if (form.school_name === '__manual__' && !form.school_name_manual.trim()) { setMsg({ type: 'err', text: 'Enter your school name.' }); return; }
    if (!form.position) { setMsg({ type: 'err', text: 'Select a position.' }); return; }

    setSubmitting(true);
    setMsg(null);
    try {
      const schoolFinal = form.school_name === '__manual__' ? form.school_name_manual.trim() : form.school_name;
      const { error: appErr } = await supabase.from('coach_applications').insert({
        user_id: user.id,
        full_name: form.full_name.trim(),
        email: user.email,
        phone: form.phone.trim() || null,
        county: form.county,
        school_name: schoolFinal,
        school_name_manual: form.school_name === '__manual__' ? form.school_name_manual.trim() : null,
        position: form.position,
        status: 'pending',
      });
      if (appErr) throw appErr;
      await supabase.from('profiles').update({ coach_status: 'pending' }).eq('id', user.id);
      setSubmitted(true);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={S.wrap}>
        <div style={S.box}>
          <div style={{ ...S.card, textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#27ae60' }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', marginBottom: 12 }}>Application Submitted</div>
            <div style={{ fontSize: 14, color: '#8a8d9e', lineHeight: 1.8, marginBottom: 24 }}>
              Your application is under review. You have full student access in the meantime.<br />
              An admin will contact you at <strong style={{ color: '#e8e6e1' }}>{user.email}</strong> once approved.
            </div>
            <button style={btn()} onClick={onBack}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Coach Application</div>
          <button style={btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>

        <div style={{ background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#8a8d9e', marginBottom: 20, lineHeight: 1.6 }}>
          Coach accounts get access to team management, student stats, and assignment creation.
          You will have full student access while your application is under review.
        </div>

        {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.card}>
            <div style={S.h2}>Your Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Full Name</label>
                <input style={S.inp} value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={S.label}>Phone (optional)</label>
                <input style={S.inp} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(850) 555-0100" type="tel" />
              </div>
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input style={{ ...S.inp, background: '#12131a', color: '#4a4d60' }} value={user.email} disabled />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.h2}>School Information</div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>County</label>
              <select style={{ ...S.inp, padding: '10px 12px' }} value={form.county} onChange={e => setField('county', e.target.value)}>
                <option value="">Select county...</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c} County</option>)}
              </select>
            </div>

            {form.county && (
              <div style={{ marginBottom: form.school_name === '__manual__' ? 14 : 0 }}>
                <label style={S.label}>School</label>
                <select style={{ ...S.inp, padding: '10px 12px' }} value={form.school_name} onChange={e => setField('school_name', e.target.value)}>
                  <option value="">Select school...</option>
                  {schoolOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            {form.school_name === '__manual__' && (
              <div style={{ marginTop: 14 }}>
                <label style={S.label}>School Name</label>
                <input style={S.inp} value={form.school_name_manual} onChange={e => setField('school_name_manual', e.target.value)} placeholder="Enter your school name" />
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <label style={S.label}>Your Position</label>
              <select style={{ ...S.inp, padding: '10px 12px' }} value={form.position} onChange={e => setField('position', e.target.value)}>
                <option value="">Select position...</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" style={{ ...btn(), width: '100%', padding: '14px 20px' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
