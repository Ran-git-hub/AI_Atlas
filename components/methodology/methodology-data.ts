/**
 * Script-side data for the methodology page, kept as source text because it is evaluated
 * in the browser: the architecture map engine (nodes, edges and the pan/zoom canvas), and
 * the rejection families, knowledge documents and monthly figures.
 */
export const CANVAS_JS = `
(function(){
const NS='http://www.w3.org/2000/svg';
const WORLD={w:1620,h:1040};
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const OWNERS={
 hermes:{name:'AI-Atlas Ops \u00b7 Hermes Agent',  c:'#22d3ee'},
 pm    :{name:'AI-Atlas PM \u00b7 OpenClaw Agent', c:'#43cc93'}
};

/* two bands say who is accountable. The PM band appears twice \u2014 once for the
   standard it sets, once for the dataset and the jobs around it \u2014 because the
   things it owns sit at opposite ends of the flow. Nodes outside a band are
   inputs, outcomes, or the human in the loop. */
const LANES=[
 {own:'hermes', x:224, y:40,  w:1100, h:560, label:'AI-ATLAS OPS \u00b7 HERMES AGENT',  sub:'runs the daily pipeline'},
 {own:'pm',     x:224, y:650, w:1100, h:350, label:'AI-ATLAS PM \u00b7 OPENCLAW AGENT', sub:'sets the standard, owns the dataset and the jobs around it'}
];

const NODES=[
 {id:'web', x:24, y:229, w:172, h:82,  kind:'io',   title:'The open web',
  role:'Where evidence lives', line:'News and case studies',
  panel:{lead:'Everything the pipeline knows comes from public writing about AI deployments. That writing is overwhelmingly promotional, which is the single fact the rest of the design is built around.',
         secs:[['What arrives from here','Links to articles that look, from a search result, like they might describe a deployment. The great majority are marketing pages, announcements and roundups wearing the grammar of a case study.'],
               ['Why it is drawn as a source, not a stage','Nothing here is under the pipeline\u2019s control. The design cannot improve the web; it can only decide what to ask it and what to believe.']]}},

 {id:'k2', x:250, y:700, w:206, h:64, kind:'know', title:'The quality bar', own:'pm',
  role:'The standard', line:'What counts as a use case',
  panel:{lead:'The definition every other decision is downstream of.',
         secs:[['A case qualifies when','A named company is doing it, it is actually running, it changes a specific business process, something was measured, and the source is a substantive article rather than a product page.'],
               ['Scale is not a use case','\u201cEveryone now has access to an assistant\u201d is verifiable and empty. The bar is set explicitly: headcount announcements carry no meaning for the atlas.'],
               ['Who answers to it','The validating stage, on the day. The quality check, on everything already stored. Neither gets to renegotiate it, which is why it is set outside the pipeline rather than inside it.']]}},

 {id:'k3', x:530, y:700, w:206, h:64, kind:'know', title:'Data standard', own:'pm',
  role:'The standard', line:'Fields, states, vocabulary',
  panel:{lead:'The shared contract that the validating stage, the recording stage and the quality check all answer to.',
         secs:[['Why it is shared','Several jobs write and check against the same shape. Keeping the rules in one place is what stops them drifting apart \u2014 which is exactly how a dataset develops inconsistencies only visible years later.'],
               ['A worked example','Coordinates must be genuinely looked up; placeholders are prohibited. On a globe a placeholder is not a missing value, it is a visible point in the wrong place.']]}},

 {id:'k1', x:250, y:80, w:206, h:64, kind:'know', title:'Query design', own:'hermes',
  role:'Reference', line:'Layers, rotation, retired',
  panel:{lead:'Owns what gets asked: the three layers, the daily rotation, the shape a query must have, and which tool answers which layer.',
         secs:[['Why queries rotate','A fixed set stops working after a few days. It keeps finding the same articles, which are by then already on record, and the day\u2019s entire output becomes duplicates.'],
               ['What it remembers','Queries measured at a zero survival rate are retired by name. Framework-name queries return tutorials; buzzword queries return vendor concept pages.']]}},

 {id:'k4', x:670, y:80, w:206, h:64, kind:'know', title:'Learnings record', own:'hermes',
  role:'Reference', line:'Feeds every stage of the run',
  panel:{lead:'The pipeline\u2019s memory. Every stage reads it, and what each stage learns goes back into it \u2014 which is what stops the same mistake being rediscovered every few months.',
         secs:[['What each stage takes from it','Searching takes which queries and which tools are still productive. Validating takes the failure modes it has been caught by before. Recording takes the identity traps that produced duplicates. Reporting takes what is worth saying about a day at all.'],
               ['What it holds','Multi-day comparisons of how the search tools convert, named queries with long zero streaks, and structural problems such as an entire language path broken by malformed responses.'],
               ['Why it is drawn touching all four','It was written as the memory of one stage and turned out to be the memory of the run. Keeping it attached to a single stage is what let the same lesson be relearned elsewhere.']]}},

 {id:'qc', x:250, y:450, w:206, h:86, kind:'job', title:'Quality check', own:'hermes',
  role:'Every day', line:'Run over everything stored',
  panel:{lead:'This job has no standard of its own. It is the quality bar and the data standard turned into checks and pointed at everything already stored \u2014 which is why it is drawn hanging off them rather than off the pipeline.',
         secs:[['Why it exists at all','The daily stages only ever see one day. Damage that accumulates \u2014 a deployer that stopped resolving, a vocabulary that drifted, a field that was thin from the start \u2014 only shows up when the whole dataset is read at once.'],
               ['What it checks','Exactly what the two standards specify: the fields the data standard requires and the shape it requires them in, and the substance the quality bar demands. Nothing it looks for is invented here.'],
               ['Dump first, then go offline','The stored cases are pulled to a local file in a single read; every check after that runs against it with no further queries. Only an actual repair goes back to the database, one case at a time \u2014 an audit that queries live data as it goes is not reproducible.'],
               ['Repairs may fetch, never invent','A thin field is rebuilt from the source material, and a case with a poor article can be re-attached to a better one. The prohibition on fabricating facts is untouched, and every correction is backed up before it is written.']]}},

 {id:'s1', x:250, y:220, w:206, h:100, kind:'step', go:'s1', accent:'#a78bfa', own:'hermes',
  eyebrow:'STAGE 1', title:'Search', line:'Casts the day\u2019s net',
  panel:{lead:'Produces a list of links worth reading, and is deliberately kept ignorant of what those links say.',
         secs:[['Its one job','Decide what to ask, choose which tool answers, discard links that structurally cannot be a case study, and hand the survivors on.'],
               ['Its hard boundary','It never opens an article. A search snippet is truncated, sometimes from the wrong page, and consistently more flattering than the page itself \u2014 so it is never treated as evidence.'],
               ['The decision that shapes it most','Three query layers aimed at three different blind spots: business process, industry, and geography. Searching one way finds one kind of case.'],
               ['What it is told to avoid','Everything already discarded is excluded before the day starts. A source retired once does not come back through the front door.']]}},

 {id:'s2', x:530, y:220, w:206, h:100, kind:'step', go:'s2', accent:'#e8a33d', own:'hermes',
  eyebrow:'STAGE 2', title:'Validate', line:'Judges against the bar',
  panel:{lead:'The only stage where judgment happens, and the only place a wrong decision has lasting consequences. Its posture is adversarial: every candidate is marketing until the article proves otherwise.',
         secs:[['Its one job','Read the article, decide whether it describes something a company runs, extract the facts, and record why every rejection was rejected.'],
               ['Its hard boundary','It never writes anything down. It produces a judgment and hands it on.'],
               ['The hardest call it makes','Deployment versus announcement. Both share nearly every word \u2014 the same company names, the same \u201cAI\u201d, the same \u201cdeployed\u201d. The distinction is tense: will enable, versus reduced.'],
               ['Why machines check it afterwards','On two separate days it was confident and wrong. Deterministic checks now scan its output for its known failure modes before anything is stored.']]}},

 {id:'s3', x:810, y:220, w:206, h:100, kind:'step', go:'s3', accent:'#43cc93', own:'hermes',
  eyebrow:'STAGE 3', title:'Persist', line:'Records each survivor',
  panel:{lead:'By this point every judgment has been made. This stage is deliberately mechanical \u2014 its only intelligence is about identity.',
         secs:[['Its one job','Recognise an article the atlas has already seen, store the case whole rather than as a link, and write it down awaiting review.'],
               ['What counts as already seen','Anything previously recorded, and anything a reviewer has archived. An archived case is a decision that this source is not worth carrying; re-ingesting it would overrule that decision automatically, every week, forever.'],
               ['Its hard boundary','It never reconsiders whether a case is good, and never promotes anything to published on its own authority.'],
               ['The subtle decision','The case keeps its full text, not just a URL. Articles get retracted, paywalled and quietly rewritten \u2014 a case that lives only as a link can evaporate without anyone touching the database.']]}},

 {id:'s4', x:1090, y:220, w:206, h:100, kind:'step', go:'s4', accent:'#22d3ee', own:'hermes',
  eyebrow:'STAGE 4', title:'Report', line:'Says what happened',
  panel:{lead:'The pipeline\u2019s contract with whoever is reading it. The least sophisticated stage and the least optional one.',
         secs:[['Its one job','Summarise the day, show which tools did the work, list the new cases, and surface how large the review queue has grown.'],
               ['Its hard boundary','Strictly read-only. It re-opens nothing and re-derives nothing \u2014 it reports what happened, it does not audit it.'],
               ['Why a zero day still gets a message','There are several ways to find nothing, and they call for different fixes. Nothing searched means a tool broke. Nothing survived means the questions were badly aimed. All already known means the queries have saturated.']]}},

 {id:'rej', x:530, y:450, w:206, h:86, kind:'sink', title:'Discarded',
  role:'Most of what a day finds', line:'Recorded with a reason',
  panel:{lead:'The largest single flow in the whole system, and the one that makes the rest worth anything.',
         secs:[['The five families','Wrong kind of page, announcement rather than operation, no process and no number, nobody identifiable, or a value outside a controlled vocabulary.'],
               ['Why every rejection carries a reason','Counts alone tell you a day was bad. Reasons tell you whether to change the queries, the sources, or nothing at all. A day dominated by vendor marketing is healthy; a day dominated by unverifiable companies means the queries drifted toward aggregators.'],
               ['It feeds back into the search','What has been discarded is excluded from later searches \u2014 a retired URL, and in the worse cases a whole domain, is never asked for again. The discard pile is the reason the same bad source does not cost anything twice.'],
               ['The asymmetry behind it','A case that should have been captured can be found again tomorrow. A brochure recorded as a deployment sits in the dataset until someone notices.']]}},

 {id:'dup', x:810, y:450, w:206, h:86, kind:'sink', title:'Already known',
  role:'Seen before, or archived', line:'Skipped, never re-ingested',
  panel:{lead:'An article the atlas has already recorded is skipped \u2014 and so is one a reviewer has archived.',
         secs:[['Two ways to be already known','The straightforward one is a case that is already on record. The other is a case that was recorded, reviewed, and archived: the reviewer\u2019s decision is kept as part of what the pipeline knows, so the same source cannot walk back in.'],
               ['Why archived still counts as seen','Archived means a human reviewer looked at that source and judged it not worth carrying. Re-ingesting it would mean automatically overruling that judgment on a schedule.'],
               ['Never revived automatically','An archived case stays archived. Nothing about a later day makes a source that was judged bad good again \u2014 reviving one is a manual act.']]}},

 {id:'ran', x:1380, y:220, w:206, h:100, kind:'human', title:'Review', accent:'#e8a33d',
  role:'Human in the loop', line:'A human decides, every time',
  panel:{lead:'The one box on this canvas that is not an agent. Nothing the pipeline records reaches the public site on its own authority \u2014 every case waits here until a human reviewer has read it and decided.',
         secs:[['Why it is a human','Every judgment before this point was made by a model working from an article. This is where that work is checked by someone accountable for it, and it is the reason the atlas can be described as reviewed rather than generated.'],
               ['What it decides','One of two things, and never nothing: the case is published, or it is archived. A case that has not been decided is still in the queue, and the daily report says how long that queue has grown.'],
               ['What it cannot be automated into','The gate could be made faster, but not removed. An agent approving its own output is not review, and the whole design of the four stages \u2014 each forbidden from its neighbour\u2019s job \u2014 exists so that this last check has something honest to check.']]}},

 {id:'pub', x:1380, y:400, w:206, h:86, kind:'sink', tint:'#43cc93', title:'Published',
  role:'Approved by a reviewer', line:'Visible as part of the atlas',
  panel:{lead:'A case a human reviewer has read and approved. Only from here does it count as part of the atlas proper.',
         secs:[['What changes','It stops carrying the not-yet-validated label and is rendered as a verified record everywhere in the product.'],
               ['Why the step is explicit','Recording and publishing are deliberately two different acts. The pipeline can be trusted to write something down; it is not trusted to decide that the public should see it.']]}},

 {id:'arc', x:1380, y:550, w:206, h:86, kind:'sink', tint:'#f2607a', title:'Archived',
  role:'Retired by a reviewer', line:'Kept, hidden, remembered',
  panel:{lead:'A case a human reviewer has read and judged not worth carrying. It is retired rather than deleted, and the decision is kept where the pipeline can use it.',
         secs:[['Why not deleted','The history stays auditable. A record that simply vanishes leaves no way to answer why something is no longer there, or whether it was ever there at all.'],
               ['It feeds the deduplication','Archived cases are part of what the recording stage treats as already seen. Without that, a source a reviewer rejected would be found again, judged again, and written again \u2014 and the reviewer would have to make the same decision every week.'],
               ['Where it is visible','Nowhere on the public site. It is excluded from every frontend surface, and its URL is blocked from re-entering.']]}},

 {id:'atlas', x:1090, y:689, w:206, h:86, kind:'core', logo:'/ai-atlas-logo.png', title:'AI Atlas', own:'pm',
  role:'The dataset behind the site', line:'Every recorded use case',
  panel:{lead:'What the whole pipeline exists to fill: a map of where AI is actually deployed, and to do what.',
         secs:[['What arrives unreviewed','New cases are visible in the product but labelled as not yet validated \u2014 a deliberate trade. Showing them is more useful than hiding them, as long as nobody can mistake them for verified.'],
               ['What is owned at this level','Everything in this band: the standard the pipeline is held to, the dataset itself, and the standing work around it \u2014 the weekly report on whether the system is working, the weekly backup, and the advertorial audit.'],
               ['What it hands on','Everything it knows about itself \u2014 the standard, the learnings, the open issues, the current state of the data \u2014 goes to the coding agents that build and deploy the product around it.']]}},

 {id:'audit', x:250, y:860, w:206, h:86, kind:'job', title:'Advertorial audit', own:'pm',
  role:'Manual, ad hoc', line:'Reviewed in batches',
  panel:{lead:'The judgment the daily gates cannot make: whether an article that passed everything else is reporting a deployment or selling one. Deliberately manual, run in review batches rather than on a schedule.',
         secs:[['The standard','Technical detail is acceptable, pure hype is not \u2014 where technical detail means a named tool, platform, model, architecture or implementation step, not \u201cimproved efficiency\u201d.'],
               ['Three dimensions, all required','A specific model or tool; a specific line, process or task; and numbers anchored to that scenario. Few anchored figures beat many floating ones.'],
               ['Disposition','An advertorial is archived, never deleted \u2014 the history stays auditable and the URL stays permanently blocked from re-entering.']]}},

 {id:'weekly', x:530, y:860, w:206, h:86, kind:'job', title:'Weekly ops report', own:'pm',
  role:'Every Monday', line:'Is the system working?',
  panel:{lead:'The daily message answers what was found. This answers whether the system is working \u2014 and it is kept for the people running it rather than published. The public half of the old weekly report is now the industry deep dive.',
         secs:[['Computes','Funnel conversion, which industries are accumulating, the status breakdown, tool usage against last week, query performance, outstanding quality issues, a system-health call, and next steps.'],
               ['Its start time is set by the job before it','It waits for Sunday\u2019s pipeline, which routinely crosses midnight. The gap between them is a deliberate buffer rather than a round number.'],
               ['Zero-data weeks are checked first','A week where the pipeline was offline gets a report that says so, rather than a normal-looking one full of zeros.']]}},

 {id:'deep', x:810, y:860, w:206, h:86, kind:'job', title:'Industry deep dive', own:'pm',
  role:'Writes up one industry', line:'From its published cases',
  panel:{lead:'The public half of what used to be the weekly report. Each piece takes one industry and sets out how AI is actually deployed in it, written from the cases in the atlas. It does not yet run on a fixed schedule.',
         secs:[['Why industry','The data has no topic dimension, but every case carries a standard industry. Around twenty industries hold enough published cases to support a piece of their own.'],
               ['What it may cite','Only published cases, and only from the industry it is about. A piece that cites an unpublished case, a case from another industry, or an industry outside the standard list is refused rather than published.'],
               ['Why cases, not news','News linked to the companies in an industry is too thin to carry a piece; the recorded cases are the evidence base.']]}},

 {id:'backup', x:1090, y:860, w:206, h:86, kind:'job', title:'Weekly backup', own:'pm',
  role:'Every Sunday', line:'Four tables, dated files',
  panel:{lead:'The plainest job in the system, and the only thing between an operator mistake and permanent loss.',
         secs:[['What it taught','A database was damaged days after the newest backup was taken, and the missing ingest was recovered instead from the pipeline\u2019s own intermediate handoff files \u2014 which nobody had thought of as a backup. They are now treated as part of the recovery surface.'],
               ['Open issue','It requests every row in one call with no pagination, and the database returns only the first page. Nothing errors \u2014 the files are valid and have been growing weekly, while quietly holding less than the whole.']]}},

 /* a reference card, like the quality bar and the data standard beside it */
 {id:'kb', x:810, y:700, w:206, h:64, kind:'know', title:'Knowledge base', own:'pm',
  role:'Standing reference', line:'Runbooks, lessons, specs',
  panel:{lead:'The standing record of what this system is and what it has already got wrong \u2014 kept outside the code, so that a lesson survives the session that learned it.',
         secs:[['What it holds','A map of the codebase, runbooks for the operations that are easy to get wrong, postmortems with the rule each one produced, the data quality reports, and the product spec.'],
               ['Who reads it','The coding agents, before touching anything. Which files to read before which kind of change is itself written down, so the reading is not left to judgement.'],
               ['Why it is not memory','An agent\u2019s memory ends with its session. A finding that cost a day to reach is worth more than that, so it is written to a file that the next session is told to open.']]}},

 {id:'ccx', x:1380, y:860, w:206, h:86, kind:'io', title:'Claude Code \u00b7 Codex',
  role:'Coding & deployment', line:'Builds and ships the product',
  panel:{lead:'The coding agents receive everything the atlas knows about itself, and are responsible for writing and deploying the product that the data is read through.',
         secs:[['What they receive','The full context held at the atlas level: the data standard, the quality bar, what the pipeline has learned, the open issues, and the current state of the dataset.'],
               ['What they are responsible for','The application code and its deployment. They build the surface the atlas is read through.'],
               ['What they never decide','What goes into the atlas, and what gets published out of it. The boundary between building the product and judging the data is the same boundary the four stages are drawn along.']]}}
];

const EDGES=[
 {a:'web', as:'r', b:'s1', bs:'l', flow:7, tone:'violet'},
 {a:'s1',  as:'r', b:'s2', bs:'l', flow:7, tone:'violet'},
 {a:'s2',  as:'b', b:'rej',bs:'t', flow:7, tone:'bad',    cls:'bad'},
 {a:'s2',  as:'r', b:'s3', bs:'l', flow:2, tone:'good',   cls:'good'},
 {a:'s3',  as:'b', b:'dup',bs:'t', flow:1, tone:'warn',   cls:'warn'},
 {a:'s3',  as:'r', b:'s4', bs:'l', flow:2, tone:'good',   cls:'good'},
 /* held high until it is past "already known", then dropped into the atlas */
 {a:'s3',  as:'b', b:'atlas',bs:'t', flow:2, tone:'good', cls:'good', cy:[370,520]},
 {a:'s4',  as:'r', b:'ran',bs:'l', flow:2, tone:'good'},
 /* the human gate, and its two possible decisions */
 {a:'ran', as:'b', b:'pub', bs:'t', flow:2, tone:'good', cls:'good'},
 {a:'ran', as:'b', b:'arc', bs:'t', flow:0, cls:'bad', cp:[1310,320,1310,550]},
 /* an archived case is one of the things stage 3 treats as already seen */
 {a:'arc', as:'l', b:'dup', bs:'r', flow:0, cls:'feedback', label:'archived, never re-ingested'},
 /* both decisions are written back to the same dataset, so the review gate
    returns to the atlas rather than ending at two loose outcomes */
 {a:'pub', as:'l', b:'atlas', bs:'r', flow:0, cls:'feedback', cp:[1280,470,1330,732]},
 {a:'arc', as:'b', b:'atlas', bs:'r', flow:0, cls:'feedback', cp:[1483,706,1392,748], label:'status synced'},
 /* the other way to be already known: the case is simply on record */
 {a:'atlas', as:'t', b:'dup', bs:'b', flow:0, cls:'feedback', cp:[1193,600,913,620], label:'already on record'},
 /* the audit's only outcome: an advertorial is archived, never deleted. No label —
    labels sit at the anchor midpoint, which for this route is nowhere near the line.
    Routed underneath everything and up the outer right edge, so it shares no
    corridor with another edge */
 {a:'audit', as:'b', b:'arc', bs:'r', flow:0, cls:'feedback',
  d:'M353 946 C 353 985, 400 985, 480 985 L 1560 985 C 1604 985, 1604 960, 1604 900 L 1604 640 C 1604 605, 1600 593, 1586 593'},
 /* what is already on record is also kept out of the judging, not only of the writing */
 {a:'dup', as:'l', b:'s2', bs:'b', flow:0, cls:'feedback', cp:[790,400,700,330], label:'excluded at validation'},
 /* what has been discarded is kept out of what gets asked for next */
 {a:'rej', as:'l', b:'s1', bs:'b', flow:0, cls:'feedback', back:true, label:'excluded from later searches'},
 {a:'k1',  as:'b', b:'s1', bs:'t', flow:0, cls:'know'},
 /* queries the learnings record shows at zero survival are retired by name */
 {a:'k1',  as:'r', b:'k4', bs:'l', flow:0, cls:'know'},
 /* the learnings record is the memory of the whole run, not of one stage */
 {a:'k4',  as:'b', b:'s1', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s2', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s3', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s4', bs:'t', flow:0, cls:'know'},
 /* the standard reaches up into the pipeline through the gaps between stages */
 {a:'k2',  as:'r', b:'s2', bs:'l', flow:0, cls:'know'},
 {a:'k3',  as:'r', b:'s3', bs:'l', flow:0, cls:'know'},
 /* the validator reads the data standard first, as well as the quality bar; routed
    up the gap between Discarded and Already known */
 {a:'k3',  as:'t', b:'s2', bs:'b', flow:0, cls:'know',
  d:'M700 700 C 700 650, 773 640, 773 590 L 773 410 C 773 360, 712 350, 700 320'},
 /* the dashboard measures the stored data against the standard that defines it */
 /* passes over the knowledge base, which now sits between the two */
 {a:'k3',  as:'r', b:'atlas', bs:'l', flow:0, cls:'know', label:'quality dashboard', lx:960, ly:676,
  d:'M736 716 C 770 690, 790 682, 830 682 L 1050 682 C 1075 682, 1085 695, 1090 712'},
 /* the deep dive is written from the atlas's published cases */
 {a:'atlas', as:'b', b:'deep', bs:'t', flow:0, cls:'feedback'},
 /* the weekly report scores the week's published cases against the same standard */
 {a:'k3',  as:'b', b:'weekly', bs:'t', flow:0, cls:'know'},
 /* the audit judges stored records against both standards, so it reads from each */
 {a:'k2',  as:'b', b:'audit', bs:'t', flow:0, cls:'know'},
 {a:'k3',  as:'b', b:'audit', bs:'r', flow:0, cls:'know', cp:[600,800,500,890]},
 /* the quality check is nothing but those two standards, run over stored cases */
 {a:'k2',  as:'t', b:'qc', bs:'b', flow:0, cls:'know'},
 {a:'k3',  as:'l', b:'qc', bs:'r', flow:0, cls:'know'},
 /* what the check finds wrong in stored cases is what validation learns to catch */
 {a:'qc',  as:'r', b:'s2', bs:'l', flow:0, cls:'feedback', cp:[505,470,505,300]},
 {a:'atlas', as:'t', b:'qc',     bs:'b', flow:0, cls:'feedback', cy:[623,623]},
 {a:'atlas', as:'b', b:'audit',  bs:'t', flow:0, cls:'feedback'},
 {a:'atlas', as:'b', b:'weekly', bs:'t', flow:0, cls:'feedback'},
 {a:'atlas', as:'b', b:'backup', bs:'t', flow:0, cls:'feedback'},
 /* the weekly report answers whether the system is working, which is a question
    about the funnel — it reads the rejection rate and the top rejection reason */
 {a:'rej', as:'b', b:'weekly', bs:'t', flow:0, cls:'feedback', cp:[440,620,440,800]},
 /* what the human finds at the gate is what the pipeline learns to catch */
 {a:'ran', as:'t', b:'k4', bs:'r', flow:0, cls:'feedback', cp:[1483,150,1000,112]},
 /* the dataset's own state and its failures are written up rather than remembered */
 {a:'atlas', as:'l', b:'kb',  bs:'r', flow:0, cls:'know'},
 /* the pipeline's own memory is reviewed and written up at the atlas level */
 {a:'k4', as:'r', b:'kb', bs:'t', flow:0, cls:'know',
  d:'M876 112 C 1053 112, 1053 140, 1053 200 L 1053 640 C 1053 680, 913 676, 913 700'},
 /* no label: the gap is 84px and the node's own subtitle already says it */
 {a:'kb',    as:'b', b:'ccx', bs:'l', flow:0, cls:'know',
  d:'M960 764 C 960 810, 1000 840, 1060 840 L 1320 840 C 1350 840, 1360 903, 1380 903'},
 {a:'atlas', as:'b', b:'ccx',    bs:'t', flow:0, cls:'know', label:'what the product renders'}
];
const byId={}; NODES.forEach(n=>byId[n.id]=n);
function anchor(n,s){
  if(s==='l')return[n.x,n.y+n.h/2];
  if(s==='r')return[n.x+n.w,n.y+n.h/2];
  if(s==='t')return[n.x+n.w/2,n.y];
  return[n.x+n.w/2,n.y+n.h];
}
function pathFor(e){
  const A=byId[e.a],B=byId[e.b];
  const [x1,y1]=anchor(A,e.as),[x2,y2]=anchor(B,e.bs);
  /* a written-out path, for the one edge that has to turn a corner: a single
     cubic cannot both clear the stage row and stay in the 84px corridor */
  if(e.d)return e.d;
  if(e.back){
    /* leaves leftward and climbs back into the stage it feeds */
    return 'M'+x1+' '+y1+' C '+(x1-70)+' '+(y1-30)+', '+x2+' '+(y2+60)+', '+x2+' '+y2;
  }
  if(e.cp){
    /* absolute control points, for edges that have to thread a gap */
    return 'M'+x1+' '+y1+' C '+e.cp[0]+' '+e.cp[1]+', '+e.cp[2]+' '+e.cp[3]+', '+x2+' '+y2;
  }
  if(e.cy){
    /* explicit control heights, for the two long edges that would otherwise
       cut a corner off a node or sit on top of a lane border */
    return 'M'+x1+' '+y1+' C '+x1+' '+e.cy[0]+', '+x2+' '+e.cy[1]+', '+x2+' '+y2;
  }
  if(e.as==='r'&&e.bs==='l'){
    const dx=Math.max(28,(x2-x1)*0.45);
    return 'M'+x1+' '+y1+' C '+(x1+dx)+' '+y1+', '+(x2-dx)+' '+y2+', '+x2+' '+y2;
  }
  /* signed, so an edge that travels upward curves the right way round */
  const s=(y2>=y1)?1:-1;
  const dy=Math.max(22,Math.abs(y2-y1)*0.5);
  return 'M'+x1+' '+y1+' C '+x1+' '+(y1+dy*s)+', '+x2+' '+(y2-dy*s)+', '+x2+' '+y2;
}

const svg=__el('cv');
const gRoot=document.createElementNS(NS,'g');
const gLanes=document.createElementNS(NS,'g');
const gEdges=document.createElementNS(NS,'g');
const gDots=document.createElementNS(NS,'g');
const gNodes=document.createElementNS(NS,'g');
const gLabels=document.createElementNS(NS,'g');
gRoot.append(gLanes,gEdges,gDots,gLabels,gNodes);
svg.appendChild(gRoot);

function mk(tag,attrs,txt){
  const e=document.createElementNS(NS,tag);
  for(const k in attrs)e.setAttribute(k,attrs[k]);
  if(txt!=null)e.textContent=txt;
  return e;
}

/* ownership bands, drawn behind everything */
LANES.forEach(L=>{
  const o=OWNERS[L.own];
  const r=mk('rect',{class:'lane','pointer-events':'none',x:L.x,y:L.y,width:L.w,height:L.h,rx:18,
    fill:o.c,'fill-opacity':.038,stroke:o.c,'stroke-opacity':.26,'stroke-width':1,'stroke-dasharray':'7 6'});
  gLanes.appendChild(r);
  const lab=mk('text',{x:L.x+18,y:L.y+23,fill:o.c,'fill-opacity':.78,'pointer-events':'none',
    'font-family':'Geist Mono, monospace','font-size':12.5,'letter-spacing':'1.5','font-weight':500},L.label);
  gLanes.appendChild(lab);
  /* measured, not estimated from a per-character width: that estimate was
     calibrated for one font size and collided with the sub the moment it changed */
  const sub=mk('text',{x:L.x+18+lab.getComputedTextLength()+18,y:L.y+23,fill:'#5f748f','pointer-events':'none',
    'font-family':'Geist, sans-serif','font-size':13},L.sub);
  gLanes.appendChild(sub);
});

/* edges */
const edgeEls=[];
EDGES.forEach((e,i)=>{
  const d=pathFor(e);
  const p=mk('path',{d:d,class:'edge '+(e.cls||''),id:'e'+i});
  gEdges.appendChild(p);
  edgeEls.push({e:e,el:p});
  if(e.label){
    const A=byId[e.a],B=byId[e.b];
    const [x1,y1]=anchor(A,e.as),[x2,y2]=anchor(B,e.bs);
    const g=mk('g',{class:'elabel'});
    const mx=e.lx??(x1+x2)/2, my=e.ly??(y1+y2)/2 - (e.as==='r'?11:0);
    const t=mk('text',{x:mx,y:my,fill:'#7d93b1','font-family':'Geist Mono, monospace','font-size':12.5,'text-anchor':'middle','letter-spacing':'.06em'},e.label);
    g.appendChild(t); g.dataset.a=e.a; g.dataset.b=e.b;
    gLabels.appendChild(g);
  }
  /* flowing dots */
  if(!REDUCED && e.flow>0){
    for(let k=0;k<e.flow;k++){
      const c=mk('circle',{r:(e.tone==='violet'?2.1:2.6),class:'dot '+(e.tone||'')});
      const am=mk('animateMotion',{dur:(e.tone==='violet'?3.2:4.4)+'s',repeatCount:'indefinite',begin:(k*(e.tone==='violet'?0.42:0.62))+'s'});
      const mp=mk('mpath',{href:'#e'+i});
      mp.setAttributeNS('http://www.w3.org/1999/xlink','href','#e'+i);
      am.appendChild(mp);
      c.appendChild(am); gDots.appendChild(c);
    }
  }
});

/* nodes */
const nodeEls={};
NODES.forEach(n=>{
  const g=mk('g',{class:'node '+n.kind,tabindex:'0',role:'button','aria-label':n.title});
  const box=mk('rect',{class:'box',x:n.x,y:n.y,width:n.w,height:n.h,rx:n.kind==='step'?13:11});
  if(n.tint){box.setAttribute('stroke',n.tint);box.setAttribute('stroke-opacity','.6');}
  g.appendChild(box);
  if(n.eyebrow){
    g.appendChild(mk('text',{x:n.x+18,y:n.y+28,fill:n.accent,'font-family':'Geist Mono, monospace','font-size':12,'letter-spacing':'1.7'},n.eyebrow));
    g.appendChild(mk('text',{x:n.x+18,y:n.y+58,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':23,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+18,y:n.y+81,fill:'#8ba0bd','font-family':'Geist, sans-serif','font-size':14.5},n.line));
  } else if(n.kind==='know'){
    g.appendChild(mk('text',{x:n.x+16,y:n.y+26,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':18,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+45,fill:'#7d93b1','font-family':'Geist, sans-serif','font-size':13.5},n.line));
  } else {
    /* the app's own mark sits beside the title, so the dataset reads as the product */
    const tx=n.logo?n.x+46:n.x+16;
    if(n.logo)g.appendChild(mk('image',{href:n.logo,x:n.x+16,y:n.y+12,width:24,height:24}));
    g.appendChild(mk('text',{x:tx,y:n.y+30,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':18,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+50,fill:'#8ba0bd','font-family':'Geist, sans-serif','font-size':14},n.role||''));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+67,fill:'#5f748f','font-family':'Geist, sans-serif','font-size':13.5},n.line||''));
  }
  g.addEventListener('click',ev=>{ev.stopPropagation();select(n.id);});
  g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(n.id);}});
  g.addEventListener('mouseenter',()=>{if(!selected)highlight(n.id);});
  g.addEventListener('mouseleave',()=>{if(!selected)clearHL();});
  gNodes.appendChild(g);
  nodeEls[n.id]=g;
});

/* highlight */
function neighbours(id){
  const s=new Set([id]);
  EDGES.forEach(e=>{if(e.a===id)s.add(e.b);if(e.b===id)s.add(e.a);});
  return s;
}
function highlight(id){
  const keep=neighbours(id);
  NODES.forEach(n=>nodeEls[n.id].classList.toggle('dim',!keep.has(n.id)));
  edgeEls.forEach(o=>{
    const on=(o.e.a===id||o.e.b===id);
    o.el.classList.toggle('hot',on);
    o.el.classList.toggle('dim',!on);
  });
  [...gLabels.children].forEach(l=>l.classList.toggle('dim',!(l.dataset.a===id||l.dataset.b===id)));
}
function clearHL(){
  NODES.forEach(n=>nodeEls[n.id].classList.remove('dim'));
  edgeEls.forEach(o=>o.el.classList.remove('hot','dim'));
  [...gLabels.children].forEach(l=>l.classList.remove('dim'));
}

/* panel */
let selected=null;
const panel=__el('cvPanel');
function select(id){
  const n=byId[id];
  selected=id;
  Object.keys(nodeEls).forEach(k=>nodeEls[k].classList.toggle('sel',k===id));
  highlight(id);
  __el('cvRole').textContent=n.role||n.eyebrow||'Node';
  __el('cvTitle').textContent=n.title;
  const body=__el('cvBody');
  const o=n.own?OWNERS[n.own]:null;
  body.innerHTML=(o?'<div style="display:inline-block;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:'+o.c+';border:1px solid '+o.c+';border-radius:999px;padding:3px 10px;margin-bottom:13px;opacity:.85">'+o.name+'</div>':'')+
    '<p style="font-size:15.4px;line-height:1.64;color:var(--text)">'+n.panel.lead+'</p>'+
    n.panel.secs.map(function(s){return '<div><h4>'+s[0]+'</h4><p>'+s[1]+'</p></div>';}).join('');
  if(n.go){
    const b=document.createElement('button');
    b.className='deep'; b.textContent='Read the full stage →';
    b.addEventListener('click',()=>go(n.go));
    body.appendChild(b);
  }
  panel.classList.add('on');
}
function deselect(){
  selected=null; panel.classList.remove('on');
  Object.keys(nodeEls).forEach(k=>nodeEls[k].classList.remove('sel'));
  clearHL();
}
__el('cvClose').addEventListener('click',deselect);
svg.addEventListener('click',()=>{if(moved){moved=false;return;} if(selected)deselect();});

/* pan + zoom */
let view={x:0,y:0,k:1};
function apply(){gRoot.setAttribute('transform','translate('+view.x+','+view.y+') scale('+view.k+')');}
function fit(){
  const r=svg.getBoundingClientRect();
  const kw=r.width/WORLD.w, kh=r.height/WORLD.h;
  /* On a phone the frame is far narrower than the diagram, so fitting the width
     draws every node at about a fifth of its size and nothing can be read. When
     the width is that much the tighter constraint, fill the height instead and
     let the reader pan sideways \u2014 the whole vertical structure still fits, and
     the labels stay legible. */
  const narrow=kw<kh*0.72;
  const k=(narrow?kh:Math.min(kw,kh))*0.95;
  view.k=k;
  view.x=narrow?12:(r.width-WORLD.w*k)/2;
  view.y=(r.height-WORLD.h*k)/2;
  apply();
}
let drag=null,moved=false;
svg.addEventListener('pointerdown',e=>{
  drag={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y,id:e.pointerId};
  moved=false;
});
svg.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
  /* only take over the pointer once this is clearly a drag, so a plain
     click still reaches the node underneath it */
  if(!moved){
    if(Math.abs(dx)+Math.abs(dy)<5)return;
    moved=true;
    try{svg.setPointerCapture(drag.id);}catch(err){}
    svg.classList.add('dragging');
  }
  view.x=drag.vx+dx; view.y=drag.vy+dy; apply();
});
['pointerup','pointercancel'].forEach(t=>svg.addEventListener(t,()=>{
  drag=null; svg.classList.remove('dragging');
}));
svg.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=svg.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const f=e.deltaY<0?1.12:1/1.12;
  const nk=Math.max(0.35,Math.min(2.6,view.k*f));
  const ratio=nk/view.k;
  view.x=mx-(mx-view.x)*ratio;
  view.y=my-(my-view.y)*ratio;
  view.k=nk; apply();
},{passive:false});
function zoomBy(f){
  const r=svg.getBoundingClientRect(), mx=r.width/2, my=r.height/2;
  const nk=Math.max(0.35,Math.min(2.6,view.k*f)), ratio=nk/view.k;
  view.x=mx-(mx-view.x)*ratio; view.y=my-(my-view.y)*ratio; view.k=nk; apply();
}
__el('cvIn').addEventListener('click',()=>zoomBy(1.2));
__el('cvOut').addEventListener('click',()=>zoomBy(1/1.2));
__el('cvFit').addEventListener('click',()=>{deselect();fit();});
window.addEventListener('resize',()=>fit());
fit();
setTimeout(fit,60);


})();
`

export const DATA_JS = `
const FAMILIES=[
  {k:'Not an article',n:'Wrong kind of page',
   d:'The link never had a chance of being a case study. Category and search pages, pricing and product pages, paper repositories, social posts, and pages whose fetched text turns out to be navigation, cookie banners or raw markup rather than writing.',
   words:[['Vendor guide','guide · tutorial · how to choose · what is · introduction to · getting started · complete guide'],['Research report','white paper · benchmark report · market report · industry report · survey'],['Self-promotion','our platform · our solution · how [vendor] uses its own product']],
   pts:['Caught as early as possible, since reading these costs time and yields nothing',
        'A page that returns mostly interface furniture is treated the same as an empty page',
        'Academic repositories are excluded outright: a paper is research, not a deployment']},
  {k:'Not a deployment',n:'Announcement, not operation',
   d:'The single largest family. The article is about something a company said, plans, or launched, rather than something it runs. It shares nearly all of its vocabulary with a genuine case study, which is why this judgment cannot be made from a search snippet.',
   words:[['News announcement','announces · brings · partners with · collaboration with · launches new · joins forces']],
   pts:['Future tense, partnership language, and "will enable" are the tells',
        'A press release with no measured outcome fails even when the deployment is real',
        'Government strategies and initiatives are excluded as a category']},
  {k:'Not specific',n:'No process, no number',
   d:'Something is happening, but the article never says what changed or by how much. This family includes the headcount announcements &mdash; large, well-sourced, and empty of operational content &mdash; along with generic capability descriptions and market commentary.',
   words:[['Roundup / statistics','benchmark · statistics · top 10 · top 5 · ranking · comparison · vs. · versus · trends 2026'],['Generic study','study shows · research finds · survey finds · report reveals']],
   pts:['"Thousands of employees now use an assistant" describes access, not a workflow',
        'A named process plus a measured result is the minimum bar for specificity',
        'Roundups, statistics posts and trend pieces fail here even when accurate']},
  {k:'Not a company',n:'Nobody identifiable',
   d:'The deployment may be entirely real, but the article never names who did it, or names something that is not a business entity. These are dropped rather than recorded with a gap, because the atlas is fundamentally a map of who.',
   pts:['"A leading European insurer" is not a company name',
        'Consortiums, alliances, initiatives and project names are not companies',
        'Inferring a plausible name is the one thing the validator must never do']},
  {k:'Not in vocabulary',n:'Fails a controlled field',
   d:'The case is real but cannot be recorded correctly &mdash; usually an industry that is not on the canonical list, or a location that cannot be resolved. Rather than record an approximation, the case is rejected and can be recovered later.',
   pts:['An invented industry value would break every industry view in the product',
        'Location is mandatory because the product is, literally, a globe',
        'This family is small, and each one is a candidate worth revisiting by hand']}
];
const SOURCES=[
 {g:'stage',t:'Pipeline orchestration',r:'Decides the shape of a run',
  d:'Defines that a day is four stages in a fixed order sharing one identity, that a missing result becomes an empty result rather than a halt, and that the report is sent under all circumstances.',
  b:[['Decides','The order of the stages, what happens when one produces nothing, and the guarantee that the day always ends in a message.'],
     ['Explicitly does not decide','Anything about searching, judging, recording or formatting. It owns the choreography and nothing else.'],
     ['Read by','The scheduled daily run, which invokes it and nothing below it directly.']]},
 {g:'stage',t:'Search definition',r:'Decides what gets asked',
  d:'Owns the query design: the three layers, the daily rotation, the shape a query must have, which tool answers which layer, and when to give up on a query.',
  b:[['Decides','Which questions today asks, how tools are chosen and substituted, and which links are discarded before anyone reads them.'],
     ['Explicitly does not decide','Whether any candidate is a real use case. It is written to be mechanically followable so that it cannot start improvising.'],
     ['Consults','The accumulated learnings record, the source list, and the environment notes, before it asks anything.']]},
 {g:'stage',t:'Validation definition',r:'Decides what is real',
  d:'The largest and most contested document in the system. It holds the acceptance bar, the rejection families, the translation discipline, and the requirement that mechanical checks run over its own output.',
  b:[['Decides','Whether a candidate is a deployment, whether its company is identifiable, whether its facts are extractable, and how it is rendered in English.'],
     ['Explicitly does not decide','Anything about storage. It produces a judgment and hands it on.'],
     ['Defers to','The shared data standard for field-level rules, and the industry vocabulary for classification.'],
     ['Notable property','It carries a running list of sources judged permanently unusable, so the same bad article cannot be reconsidered every week.']]},
 {g:'stage',t:'Persistence definition',r:'Decides what already exists',
  d:'Owns identity and nothing else: whether an article has been recorded before, what a case must resolve before it can be stored, and what state it arrives in.',
  b:[['Decides','Duplicate detection, what a case must resolve before it is written, and the reviewed-or-not state it arrives in.'],
     ['Explicitly does not decide','Quality. By the time this runs, quality has been settled and is not revisited.'],
     ['Defers to','The shared data standard for every field it writes, including which fields may never be empty.']]},
 {g:'stage',t:'Reporting definition',r:'Decides what gets said',
  d:'Owns the daily message: its structure, its wording on an empty day, the backlog thresholds, and the rule that the run is only archived once the message lands.',
  b:[['Decides','How the day is summarised, when the review backlog is escalated from a note to a warning, and what a zero day is told.'],
     ['Explicitly does not decide','Anything it reports. It is strictly downstream and re-derives nothing.'],
     ['Consults','The learnings record, so its observations are written against history rather than a single day.']]},
 {g:'shared',t:'Data standard',r:'Defines what a record must be',
  d:'The shared contract both the validator and the persistence stage answer to. It defines every field a use case carries, which of them may never be empty, and what the three record states mean throughout the product.',
  b:[['Decides','Field-level requirements, the meaning of unreviewed, published and retired, geographic standardisation, and minimum content standards.'],
     ['Why it is shared','Two stages write against the same schema. Keeping the rules in one place is what stops them drifting apart, which is exactly how a dataset develops inconsistencies that are only visible years later.'],
     ['Notable rule','Coordinates must be genuinely looked up. Placeholder values are prohibited, because on a globe a placeholder is not a missing value &mdash; it is a visible point in the wrong place.']]},
 {g:'shared',t:'Industry vocabulary',r:'Defines the permitted values',
  d:'A single closed list of permitted industry values, and the sole authority for that field. The product generates its own copy from it rather than maintaining a parallel one.',
  b:[['Decides','Every value the industry field may take, plus two explicitly permitted non-standard entries for organisations that fit no commercial category.'],
     ['Design property','The generation step verifies the count and refuses to write if it is wrong, so a malformed edit fails loudly rather than shipping a silently truncated vocabulary.'],
     ['Classification rule','A case takes the industry of the organisation deploying it, not of the AI itself. A hospital using computer vision is healthcare.']]},
 {g:'shared',t:'Learnings record',r:'Remembers what has not worked',
  d:'The pipeline’s memory. Running analysis of which queries produce nothing, which tools outperform which, and which quality problems keep recurring.',
  b:[['Decides','Nothing directly &mdash; it has no authority. But it is the input to almost every rule change, and every stage of the run reads it.'],
     ['Typical content','Multi-day comparisons showing one search tool converting roughly ten times better than another, named queries with long zero streaks, and structural problems such as an entire language path being broken by malformed responses.'],
     ['Why it exists','Without it, the same unproductive query gets rediscovered and re-added every few months.']]},
 {g:'shared',t:'Source list',r:'Remembers where not to look',
  d:'The catalogue of publications worth searching, annotated with the ones that have stopped working and why.',
  b:[['Decides','Which parts of the web are worth the pipeline’s attention.'],
     ['Maintenance pattern','A dead source is annotated in place with the date and the reason rather than deleted, so the history of why it was dropped survives &mdash; a domain blocked for a temporary outage is a different case from one whose DNS no longer resolves.']]},
 {g:'shared',t:'Run history',r:'Records what actually happened',
  d:'One entry per completed day, written only after the report is confirmed delivered. The pipeline’s own evidence base.',
  b:[['Decides','Nothing. It is the measurement layer that makes every other decision reviewable.'],
     ['Why delivery-gated','An entry means a day that finished and was communicated. A run that produced results but failed to report leaves a gap, which is the honest record of what the maintainer experienced.'],
     ['What it enables','Every claim on this page about survival rates, tool performance and rejection patterns is read from this record.']]},
 {g:'build',t:'Product specification',r:'Defines what the product is',
  d:'The description of the atlas as a product rather than as a pipeline: what it shows, who it is for, and which surfaces exist. Every decision about what to build is measured against it.',
  b:[['Decides','What the product contains, what each view is for, and what is deliberately out of scope.'],
     ['Explicitly does not decide','Anything about how a case gets found or judged. It describes the destination, not the route.'],
     ['Read by','Whoever is building a surface, before they decide what it should do.']]},
 {g:'build',t:'Codebase notes',r:'Decides what is safe to change',
  d:'The standing reference for the application side: which tables back which pages, which data functions are cached and which are not, how the routes map, and the failure modes this code has produced that returned valid output and raised nothing.',
  b:[['Decides','Where to look before changing anything, and which past mistakes not to repeat.'],
     ['Explicitly does not decide','The data standard. It records how the app reads the data, not what the data must be.'],
     ['Notable property','It is kept current as a rule: when a read contradicts it, the file is corrected in the same session.']]},
 {g:'build',t:'Cache runbook',r:'Decides how a change reaches readers',
  d:'The procedure for purging cached data and the map of which tag covers which surface. Without it a corrected record can stay invisible for a day, or a purge can cost far more than it needed to.',
  b:[['Decides','Which tag to purge for a given change, and in what order.'],
     ['Explicitly does not decide','Whether the change itself was right.'],
     ['Read by','Anyone who has just written to the database and needs the site to agree.']]}
];
const MONTHS=[
 {m:'April',    pub:227, arc:152},
 {m:'May',      pub:89,  arc:2},
 {m:'June',     pub:188, arc:283},
 {m:'July',     pub:39,  arc:133},
 {m:'August',   pub:49,  arc:238},
 {m:'September',pub:15,  arc:145}
];
return {FAMILIES,SOURCES,MONTHS};
`
