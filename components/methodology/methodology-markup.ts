/**
 * The methodology page's markup, as static HTML so the server renders every word of it.
 *
 * Authored as one document, like the rest of this page: the behaviour in
 * methodology-body.tsx only attaches to it (the particle field, the chapter bar, the
 * scroll-led emphasis, the architecture map). Edit copy here directly. It must stay
 * tag-balanced - it is injected with dangerouslySetInnerHTML, and a stray closing tag
 * makes the server and client trees disagree.
 */
export const MARKUP = `<canvas class="mx-fx" aria-hidden="true"></canvas>
    <nav class="mx-bar" aria-label="Chapters">
      <div class="mx-bar-in"><div class="mx-bar-n"><b>01</b><span></span></div><div class="mx-bar-l"></div></div>
      <div class="mx-prog" aria-hidden="true"><i></i></div>
    </nav>
    <div class="mx-hud" aria-hidden="true"><div data-k="found"><b>~11,400</b><span>found</span></div><i></i><div data-k="val"><b>1,718</b><span>validated</span></div><i></i><div data-k="pub"><b>700</b><span>published</span></div></div>
    <section class="mx-ch mx-hero" data-scene="cloud" data-nav="Intro" id="sec-ov">
    <div class="mx-wrap">
      <div class="mx-eyebrow"><b>Methodology & Agents</b></div>
      <h1><span class="l0">Agents find it.</span> <span class="l1">Harnesses filter it.</span> <span class="l2">A human publishes it.</span></h1>
      <div class="mx-hero-b">
        <p>AI Atlas records where AI is actually deployed in the real world — which company, which process, what changed, and what was measured.</p><p>Every day, agents search the open web and filter out <b>85%</b>: announcements, vendor brochures, roundups, anything with no named company or no measured outcome. A human reviewer reads the <b>15%</b> that survives and decides what is worth publishing — the last <b>6%</b>.</p><p>A repository of real AI deployments, for research, insight and inspiration.</p>
      </div>
      <div class="mx-fun">
        <div class="f0"><b>~11,400</b><span>candidates found in total</span></div><i aria-hidden="true"></i><div class="f1"><b>1,718</b><span>passed the agents' daily validation</span></div><i aria-hidden="true"></i><div class="f2"><b>700</b><span>published after human-in-the-loop review</span></div>
      </div>
      <p class="mx-note">Counted from 22 March 2026 to 15 September 2026. One dot &asymp; ten candidates.</p>
    </div>
    <div class="mx-cue" aria-hidden="true"><span></span></div>
  </section>
<section class="mx-ch" data-scene="dust" data-nav="System map" id="sec-map">
    <div class="mx-wrap">
      <div class="mx-sub"><h3>The multi-agent architecture</h3><span><i class="w">select any node &middot; drag to pan &middot; ctrl / &#8984; + scroll to zoom</i><i class="n">tap any node &middot; drag sideways to explore</i></span></div>
      <div class="mth mx-embed" id="mxMap"><div class="canvas-frame" id="cvFrame">
      <svg id="cv" role="img" aria-label="Interactive map of the pipeline: sources, four stages, discard paths, the atlas, and review"></svg>
      <div class="cv-tools">
        <button class="cv-btn" id="cvOut" aria-label="Zoom out">−</button>
        <button class="cv-btn" id="cvIn" aria-label="Zoom in">+</button>
        <button class="cv-btn" id="cvFit">Fit</button>
      </div>
      <div class="cv-hint"><span class="wide">DRAG TO PAN · SCROLL TO ZOOM · SELECT ANY NODE</span><span class="narrow">DRAG SIDEWAYS TO EXPLORE · TAP ANY NODE</span></div>
      <aside class="cv-panel" id="cvPanel" aria-live="polite">
        <div class="cv-panel-h">
          <div style="min-width:0">
            <div class="r" id="cvRole">—</div>
            <h3 id="cvTitle">—</h3>
          </div>
          <button class="cv-panel-x" id="cvClose" aria-label="Close">×</button>
        </div>
        <div class="cv-panel-b" id="cvBody"></div>
      </aside>
    </div><div class="cv-legend below">
      <b>WHO OWNS IT</b>
      <span><i class="own" style="border-color:#22d3ee"></i>Ops · Hermes Agent</span>
      <span><i class="own" style="border-color:#43cc93"></i>PM · OpenClaw Agent</span>
      <b class="gap">WHAT MOVES</b>
      <span><i style="background:#a78bfa"></i>candidates</span>
      <span><i style="background:#43cc93"></i>survivors</span>
      <span><i style="background:#f2607a"></i>discarded</span>
      <span><i style="background:#2a3a55"></i>reference &amp; feedback</span>
    </div></div>
    </div>
  </section>
<section class="mx-ch mx-prin" data-scene="dust" data-nav="Principles" id="sec-prin">
    <div class="mx-wrap">
      <div class="mx-sub"><h3>The four principles the whole design rests on</h3><span>what every other decision follows from</span></div>
      <div class="mx-prin-g">
        <article>
          <span class="pn">01</span>
          <h4>One job per stage, and a hard boundary around it</h4>
          <p class="lead">Every stage may do exactly one thing — and is forbidden from its neighbour's.</p>
          <p class="pb">Search can drop a link that is obviously wrong, but it never opens the article. Validate decides, and never writes. Persist writes, and never decides again. Report only reads. The lines are drawn where they are so that when something goes wrong, it is clear which stage did it. A stage that quietly does its neighbour's job hides its own mistakes.</p>
        </article><article>
          <span class="pn">02</span>
          <h4>The pipeline may fail; the report may not</h4>
          <p class="lead">A day that finds nothing still says which kind of nothing it found.</p>
          <p class="pb">Every stage passes something on, even when that something is empty, and a stage with nothing to give does not stop the run. Nothing found means a tool broke. Nothing survived means the day's questions were badly aimed. Everything already on record means the queries have gone stale. If the pipeline simply went quiet, none of that could be told apart from a crash.</p>
        </article><article>
          <span class="pn">03</span>
          <h4>When in doubt, reject</h4>
          <p class="lead">A missed case is recoverable. A false one is not.</p>
          <p class="pb">A case that gets missed today can be found again tomorrow. A vendor brochure filed as a real deployment sits in the data, and on the globe, until someone spots it. That trade is on purpose, and it is why more than eight in ten candidates are thrown out on a normal day.</p>
        </article><article>
          <span class="pn">04</span>
          <h4>Deterministic checks verify the model's judgment</h4>
          <p class="lead">The model is trusted to judge. It is not trusted to be the last word.</p>
          <p class="pb">Reading the article and weighing it up is the part only the model can do. But it gets things wrong in the same ways over and over — it forgets to translate, it takes a vendor's own product page for a customer deployment. So everything it produces runs through plain mechanical checks before it is written down.</p>
        </article>
      </div>
    </div>
  </section>
<section class="mx-ch mx-stage" data-scene="s1" data-nav="01 Search" id="sec-s1" style="--sc:#a78bfa">
      <div class="mx-wrap"><div class="mx-stage-c">
        <div class="mx-num" aria-hidden="true">01</div>
        <div class="mx-of">Stage one of four</div>
        <h2>Search</h2>
        <p class="mx-lede">Produces a list of links worth reading, and is deliberately kept ignorant of what those links say. A searcher that starts forming opinions about content will discard things the validator would have caught, on far less evidence.</p>
        <div class="mx-duty">
          <div class="can"><h5>Responsible for</h5><ul><li>Deciding which queries today should ask</li><li>Choosing which tool answers each one, and recovering when a tool goes quiet</li><li>Discarding links that structurally cannot be a case study</li><li>Removing duplicates and normalising what survives</li></ul></div>
          <div class="cant"><h5>Forbidden from</h5><ul><li>Opening an article and reading it</li><li>Treating a search snippet as if it were the article</li><li>Repairing a broken link or inventing a missing title</li><li>Improvising extra queries beyond what the day calls for</li></ul></div>
        </div>
        <div class="mx-figs "><div><b style="color:var(--violet)">3</b><span>query layers</span></div><div><b style="color:var(--violet)">14</b><span>searches a day</span></div><div><b style="color:var(--violet)">2</b><span>retries, then stop</span></div></div>
        <div class="mx-decs">
          <div class="mx-sub"><h3>Design decisions</h3><span>and what each one answers</span></div>
          <details><summary><span>D1</span><b>Three query layers, aimed at three different blind spots</b><i></i></summary><div class="db"><p class="body">Searching one way finds one kind of case. The layers exist so that no one kind of coverage can quietly collapse.</p><div class="tw"><table>
            <thead><tr><th>Layer</th><th>Asks about</th><th>Guards against</th></tr></thead>
            <tbody>
              <tr><td><span class="pill p-v">Process</span></td><td>Specific business workflows — claims, fraud review, code review, contact centre</td><td>Missing the ordinary, unglamorous deployments that make up most real adoption</td></tr>
              <tr><td><span class="pill p-i">Industry</span></td><td>A different sector each day of the week</td><td>The dataset skewing toward whichever industries publish most loudly</td></tr>
              <tr><td><span class="pill p-ok">Geography</span></td><td>A rotating set of countries each day</td><td>An atlas that is really just a map of the United States</td></tr>
            </tbody>
          </table></div></div></details><details><summary><span>D2</span><b>Every query must name a process, a deployment, and a number</b><i></i></summary><div class="db"><p class="body">A query that asks only about "AI" returns opinion. The shape that works asks for all three at once: a concrete business process, a word that means the thing is actually running, and a word that implies a measured outcome. That triple is the cheapest stand-in for the call the validator will later have to make properly — between something a company <em>announced</em> and something a company <em>does</em>. Queries that drop any leg of the triple have been measured at a zero survival rate.</p></div></details><details><summary><span>D3</span><b>Queries rotate daily out of a larger pool</b><i></i></summary><div class="db"><p class="body">A fixed set of queries stops working after about three days: it keeps finding the same articles, which are by then already on record, and the run's entire output becomes duplicates. Rotation ensures the same question does not repeat for weeks. The choice comes from the date, so the same day always asks the same questions — which matters when you are trying to explain why a particular day found nothing.</p></div></details><details><summary><span>D4</span><b>Each layer has its own preferred search tool</b><i></i></summary><div class="db"><p class="body">Originally every query tried the tools in one fixed order, falling through on failure. The effect was that the cheapest tool answered almost everything and the strongest semantic search was never reached at all — it went weeks without being called once. Assigning each layer a primary tool forces all of them into use, and a measured comparison showed that the starved tool produced several times more surviving candidates than the chain it had been buried under.</p></div></details><details><summary><span>D5</span><b>Fall back on silence, not only on errors</b><i></i></summary><div class="db"><p class="body">The failure that shaped this rule was a tool hitting its weekly quota and returning that as a successful response containing zero results. Nothing crashed, nothing was logged as broken, and the day simply recorded that the world had produced no AI deployments. Empty is now treated as a failure signal in its own right, alongside rate limits, timeouts and unparseable responses. A rerun through a different tool recovered twenty candidates and a real case that would otherwise have been lost silently.</p><p class="body">The retry budget stops at two attempts per query. Beyond that the query is abandoned and recorded as abandoned — a run that takes all day to fail is worse than one that reports a gap.</p></div></details>
        </div>
      </div></div>
    </section>
<section class="mx-ch mx-stage" data-scene="s2" data-nav="02 Validate" id="sec-s2" style="--sc:#e8a33d">
      <div class="mx-wrap"><div class="mx-stage-c">
        <div class="mx-num" aria-hidden="true">02</div>
        <div class="mx-of">Stage two of four</div>
        <h2>Validate</h2>
        <p class="mx-lede">The stage the whole pipeline exists to protect. Everything upstream is cheap and everything downstream is mechanical. This is where judgment happens, and it is adversarial by design: every candidate is marketing until the article proves otherwise.</p>
        <div class="mx-duty">
          <div class="can"><h5>Responsible for</h5><ul><li>Actually fetching and reading each article</li><li>Deciding whether it describes a deployment at all</li><li>Extracting company, place, industry and outcome, in English</li><li>Recording <em>why</em> each rejection was rejected</li></ul></div>
          <div class="cant"><h5>Forbidden from</h5><ul><li>Writing anything to the database</li><li>Inventing a fact the article does not contain</li><li>Keeping a case whose company cannot be identified</li><li>Rejecting a source for the language it is written in</li></ul></div>
        </div>
        <div class="mx-figs "><div><b style="color:var(--amber)">10</b><span>rules, all must pass</span></div><div><b style="color:var(--rose)">85%</b><span>rejected at validation</span></div><div><b style="color:var(--green)">2</b><span>mechanical checks on its output</span></div></div>
        <div class="mx-decs">
          <div class="mx-sub"><h3>Design decisions</h3><span>and what each one answers</span></div>
          <details><summary><span>D1</span><b>Language is a translation problem, never a quality signal</b><i></i></summary><div class="db"><p class="body">A Chinese power-grid deployment and a Japanese bank rollout are first-class cases. The source may be in any language. The output must be English, so a non-English article is translated, not discarded. A machine check enforces that, because the failure runs both ways: told "output must be English", a model starts throwing away perfectly good foreign-language sources; told "translate everything", it sometimes leaves the original text in place. Both have happened.</p></div></details><details><summary><span>D2</span><b>The hardest filter is deployment versus announcement</b><i></i></summary><div class="db"><p class="body">Most of what the web publishes about enterprise AI is a press release about intent. It shares almost every word with a real case study — the same company names, the same "AI", the same "deployed". The distinction comes down to verb tense.</p><div class="split">
            <div>
              <span class="label" style="color:var(--rose)">Reject patterns</span>
              <p style="color:#98a9c0">will enable · is set to · announces a partnership · launches · no metric yet</p>
            </div>
            <div>
              <span class="label" style="color:var(--green)">Accept patterns</span>
              <p style="color:var(--bright)">deployed at · in production · reduced review time 40% · saved 6 hours per case</p>
            </div>
          </div></div></details><details><summary><span>D3</span><b>Scale is not a use case</b><i></i></summary><div class="db"><p class="body">"Two hundred thousand employees now have access to an AI assistant" is a real, verifiable, well-sourced fact, and it says nothing about how anyone's work changed. The bar says so explicitly: headcount announcements are not use cases and mean nothing for the atlas. The same company becomes acceptable the moment the article names a process — claims handling, document review, fraud triage — and what changed about it.</p></div></details><details><summary><span>D4</span><b>A named company, or nothing at all</b><i></i></summary><div class="db"><p class="body">Anonymous case studies — "a leading European insurer" — are dropped entirely rather than recorded with a blank. A model will be tempted to invent a plausible name, and one fabricated company would undermine every other record in the dataset. Consortiums, alliances, initiatives and project names are likewise not companies. The atlas is a map of who is doing this, and a point on it that names nobody is worse than an empty space.</p></div></details><details><summary><span>D5</span><b>The model's output is checked by something that cannot be persuaded</b><i></i></summary><div class="db"><p class="body">After the validator finishes, mechanical checks run over its output looking for the specific ways it is known to fail: untranslated text left in place, vendor press domains accepted as sources, announcement phrasing, roundups and listicles, missing geography. Anything they catch is moved into the rejected pile before persistence sees it. These exist because on two separate days the validator was confident and wrong — once shipping untranslated records, once shipping seventeen vendor pages. They are not optional, and they do not get skipped when the output "looks fine" — looking fine is exactly the failure mode.</p></div></details>
        </div>
      </div></div>
    </section>
<section class="mx-ch mx-stage" data-scene="s3" data-nav="03 Persist" id="sec-s3" style="--sc:#43cc93">
      <div class="mx-wrap"><div class="mx-stage-c">
        <div class="mx-num" aria-hidden="true">03</div>
        <div class="mx-of">Stage three of four</div>
        <h2>Persist</h2>
        <p class="mx-lede">By this point every judgment about the case has been made. This stage is deliberately mechanical. Its only intelligence is about identity: has this article already been recorded, and does everything the case depends on actually resolve?</p>
        <div class="mx-duty">
          <div class="can"><h5>Responsible for</h5><ul><li>Recognising an article the atlas has already seen</li><li>Storing the case whole — its text, not just a link to it</li><li>Writing it down in a state that awaits review</li><li>Handing reporting an accurate account of what it did</li></ul></div>
          <div class="cant"><h5>Forbidden from</h5><ul><li>Reconsidering whether a case is good</li><li>Promoting anything to published on its own authority</li><li>Halting the run because one record failed to write</li></ul></div>
        </div>
        <div class="mx-figs "><div><b style="color:var(--green)">4</b><span>things must resolve before a case is written</span></div><div><b style="color:var(--green)">2</b><span>ways to be already known</span></div><div><b style="color:var(--amber)">0</b><span>auto-published</span></div></div>
        <div class="mx-decs">
          <div class="mx-sub"><h3>Design decisions</h3><span>and what each one answers</span></div>
          <details><summary><span>D1</span><b>Deduplication ignores whether the earlier record was any good</b><i></i></summary><div class="db"><p class="body">If an article is already on record it is skipped — even when a reviewer read that earlier record and retired it. That is counter-intuitive but deliberate: retired means someone judged this source invalid. Re-ingesting it would overrule that decision automatically, every week, forever. Reviving a retired case is a manual act, never an automatic one.</p></div></details><details><summary><span>D2</span><b>A case is stored whole, and keeps a pointer to its source</b><i></i></summary><div class="db"><p class="body">The record keeps the deployment's full text — five hundred characters at minimum — rather than a link and a headline. Articles rot: they get retracted, paywalled, restructured, or quietly rewritten to say something softer. A case that lives only as a URL is a case that can evaporate without anyone touching the database.</p><p class="body">It also makes a specific repair possible. When the article turns out to be poor but the deployment behind it is worth keeping, there is a set procedure: find a better source and attach it, rather than throw the case away and hope the same deployment turns up again.</p></div></details><details><summary><span>D3</span><b>A case exists only once everything it points at resolves</b><i></i></summary><div class="db"><p class="body">A use case is not a standalone note. It carries a deployer, a place, an industry and a source, and each has to resolve to something real before the case can be written — a named organisation, coordinates that put it somewhere on the globe, an industry from the closed vocabulary. A field that does not resolve sends the case back. It is never filled with a blank.</p><p class="body">A retired case is never revived automatically. It was retired because that article was judged bad, and nothing about a later day makes it good.</p></div></details><details><summary><span>D4</span><b>New cases arrive unreviewed, on purpose</b><i></i></summary><div class="db"><p class="body">A case is written in a state that means "awaiting review". It is visible in the product, but labelled as such. That is a deliberate trade: showing it unverified is more useful than hiding it, as long as nobody can mistake it for verified. The pipeline never promotes its own work.</p></div></details><details><summary><span>D5</span><b>One bad case never takes down the day</b><i></i></summary><div class="db"><p class="body">A malformed field is corrected and retried. A network failure is retried once. If a case still cannot be written, it is skipped and recorded as skipped, and the run continues with the rest. The stage always hands something onward, even when it wrote nothing at all — because the alternative is a day that ends in silence, and silence is the one outcome the design does not permit.</p></div></details>
        </div>
      </div></div>
    </section>
<section class="mx-ch mx-stage" data-scene="s4" data-nav="04 Report" id="sec-s4" style="--sc:#22d3ee">
      <div class="mx-wrap"><div class="mx-stage-c">
        <div class="mx-num" aria-hidden="true">04</div>
        <div class="mx-of">Stage four of four</div>
        <h2>Report</h2>
        <p class="mx-lede">The pipeline's contract with its reviewer. The least sophisticated stage and the least optional one: a day that finds nothing still ends with a message, because an absent message means something broke and nobody knows what.</p>
        <div class="mx-duty">
          <div class="can"><h5>Responsible for</h5><ul><li>Summarising the day: added, already known, failed</li><li>Showing which tools did the work, so a quiet tool is visible early</li><li>Listing each new case in a form a reviewer can act on</li><li>Surfacing the review backlog, and escalating as it grows</li></ul></div>
          <div class="cant"><h5>Forbidden from</h5><ul><li>Re-opening any article</li><li>Re-checking content or re-validating a case</li><li>Recomputing numbers the earlier stages established</li></ul><p>The one exception is a counts-only look at the database, just to say how large the review queue has become.</p></div>
        </div>
        <div class="mx-figs "><div><b style="color:var(--cyan)">1</b><span>message a day, always</span></div><div><b style="color:var(--amber)">50</b><span>pending before it warns</span></div><div><b style="color:var(--green)">0</b><span>articles re-opened</span></div></div>
        <div class="mx-decs">
          <div class="mx-sub"><h3>Design decisions</h3><span>and what each one answers</span></div>
          <details><summary><span>D1</span><b>A zero day still gets a report, and says which zero it was</b><i></i></summary><div class="db"><p class="body">A day can produce nothing in several different ways, and each calls for a different fix. Nothing was searched means a tool is broken. Nothing survived validation means the day's questions were poorly aimed. Everything was already on record means the queries have saturated and need rotating. Collapsing all three into "no results" would throw away the only signal that says what to fix.</p></div></details><details><summary><span>D2</span><b>The report says when review has fallen behind</b><i></i></summary><div class="db"><p class="body">Because everything the pipeline records waits for review, the review queue is a real bottleneck — and one the pipeline can see but not fix. So the daily message reports the backlog and changes its tone as it grows, from a note to a warning.</p></div></details><details><summary><span>D3</span><b>A run is counted only once the message actually lands</b><i></i></summary><div class="db"><p class="body">The day's metrics are archived after delivery is confirmed, never before. This makes the metrics history mean something precise: every line in it is a run that finished and got reported. A run that produced cases but failed to report leaves no line. That is correct: from the reviewer's point of view that day did not happen, and the gap says so honestly.</p></div></details><details><summary><span>D4</span><b>Reporting reads the same learnings the searcher does</b><i></i></summary><div class="db"><p class="body">The observations at the end of each report are written against the running record of what has and has not been working, not off the day in isolation. That shared reference is what turns a daily message into a feedback loop: patterns noticed in reports become notes, notes become retired queries and new rules, and those rules change what tomorrow's search asks.</p></div></details>
        </div>
      </div></div>
    </section>
<section class="mx-ch mx-stage mx-gate" data-scene="review" data-nav="Human review" id="sec-review" style="--sc:#e8a33d">
    <div class="mx-wrap"><div class="mx-stage-c">
      <div class="mx-of">nothing publishes itself</div>
      <h2>Where a human sits in the loop</h2>
      <p class="mx-lede">The pipeline never publishes on its own authority. Everything it records arrives in an unreviewed state and waits for review.</p>
      <div class="mx-gate-g">
        <div><b>Cases arrive labelled, not hidden</b><p>They are visible in the product from the moment they are written, but carry a label saying they are not yet validated.</p></div><div><b>A reviewer decides, never the pipeline</b><p>Each case is approved or rejected by hand in the dashboard. Nothing the pipeline writes promotes itself.</p></div><div><b>The report watches the queue</b><p>It surfaces the size of the review backlog and hardens its wording as that backlog grows, so the system can say when review has fallen behind.</p></div><div><b>Rejection is retirement, not deletion</b><p>A rejected case is kept for history and its source is permanently off-limits, so the same bad article cannot come back next week.</p></div>
      </div>
    </div></div>
  </section>
<section class="mx-ch mx-deep" data-nav="Quality bar" id="sec-bar">
    <div class="mx-wrap">
      <header class="mx-chh" data-scene="bar"><div class="mx-chh-c">
        <div class="mx-eyebrow"><span>The harness around them</span><b>Quality bar</b></div>
        <h2>What counts as a use case, and what only<span class="fade"> looks like one</span></h2>
        <p class="mx-lede">Nearly every design decision in the pipeline is downstream of this definition. It is worth stating plainly, because most of what the web publishes about enterprise AI fails it.</p>
        <div class="mx-figs "><div><b style="color:var(--rose)">5</b><span>families of rejection</span></div><div><b style="color:var(--amber)">3</b><span>tests an advertorial must pass</span></div><div><b style="color:var(--violet)">17</b><span>rules, run by hand</span></div></div>
    </div></header>
      <div class="mx-body" data-scene="dust">
      <div class="mx-sub"><h3>Where the bar sits, and why</h3></div>
      <div class="mx-two">
        <p class="mx-p big">The atlas exists to answer a question that is otherwise very hard to answer honestly: where is AI actually being used, and to do what. Announcements, headcount figures and market reports are abundant and answer none of that. The bar is not conservative by accident — it is what makes the remaining tenth worth anything.</p>
        <div>
          <div class="mx-k">A case qualifies when</div>
          <ol class="mx-qual"><li><b>A named company</b> — a real business entity, not a consortium or a project</li><li><b>Actually running</b>, not planned or announced</li><li>It changes a <b>specific process</b> — claims, inspection, underwriting, triage</li><li><b>Something was measured</b> — a percentage, a time, a cost, a rate</li><li>A <b>substantive article</b> about the deployment, not a product page</li></ol>
          <p class="mx-note">A vendor's own writing counts only if it names the customer and reports real numbers. Otherwise it is a brochure with a case study's grammar.</p>
        </div>
      </div>
      <div class="mx-pin"><div class="mx-pinc">
      <div class="mx-sub"><h3>What the bar rejects</h3><span>The five families of rejection</span></div>
      <p class="mx-p">Every rejected candidate is recorded with a reason, and those reasons cluster into five recognisable families. Knowing which family dominates on a given day is what tells you whether the problem is the queries, the sources, or the bar.</p>
      <div class="mx-fam"><div class="mx-fam-t" id="mxFamT" role="tablist"></div><div class="mx-fam-p" id="mxFamP"></div></div>
      </div></div>
      <div class="mx-pin"><div class="mx-pinc">
      <div class="mx-sub"><h3>Telling a deployment from an advertorial</h3></div>
      <div class="mx-two"><p class="mx-p big">A separate rule set, applied by hand over records already stored, decides whether an article that passed every daily gate is reporting a deployment or selling one.</p><p class="mx-p">The standard fits in one line: <em>technical detail is acceptable, pure hype is not</em> — a named tool, platform, model or implementation step, not “improved efficiency”. One line proved too loose, so it became three tests that must all pass.</p></div>
      <div class="mx-dims">
      <div class="dim"><span class="dn">AI technology</span><span class="dq">Is a specific model, algorithm or tool named?</span><div class="ex ok"><span class="h">Qualifies</span>“a bespoke CNN model” · “Azure OpenAI” · “a time-series LLM”</div><div class="ex no"><span class="h">Too vague</span>“uses AI” · “AI-driven” · “advanced algorithms”</div></div>
      <div class="dim"><span class="dn">Deployment scenario</span><span class="dq">Which line, which process, which task?</span><div class="ex ok"><span class="h">Qualifies</span>“overhead conveyor line, clip and clamp detection” · “claims processing at a named hospital”</div><div class="ex no"><span class="h">Too vague</span>“improving efficiency” · “optimising operations” · “transforming X”</div></div>
      <div class="dim"><span class="dn">Anchored numbers</span><span class="dq">Is the figure tied to that scenario?</span><div class="ex ok"><span class="h">Qualifies</span>“30 ms processing” · “86% accuracy” · “20 minutes down to 10 seconds”</div><div class="ex no"><span class="h">Too vague</span>“significantly improved” · “high accuracy” · a bare “N% better”</div></div>
    </div>
      <p class="mx-p">Few numbers, all anchored, beat many that float. The template it exists to catch satisfies none of the three: “X deployed AI to revolutionise Y. The system uses advanced computer vision to detect defects with high accuracy, improving quality and reducing costs.”</p>
      </div></div>
      <div class="mx-sub"><h3>The seventeen rules</h3><span>one pre-check · thirteen verdicts · one disposition · two audits</span></div>
      <div class="mth mx-embed"><div class="triage">

      <div class="tbar" style="--tc:#22d3ee">
        <div class="tlab"><i>Runs first</i><code>R11</code></div>
        <div class="tb">
          <b>URL health check</b>
          <p>Mandatory before R1–R10 are evaluated at all. There is no point judging an article that will not load, and every later rule assumes the page in front of it is the page on record.</p>
        </div>
      </div>

      <div class="tflow"><span class="line"></span><span>then one verdict, from thirteen</span></div>

      <div class="tgrid">
      <div class="tcol" style="--tc:#f2607a">
        <div class="th"><b>Reject</b><em>7</em></div>
        <div class="tr"><code>R1</code><span><b>Blocklisted source</b> — subscription walls, unknown aggregators with no editorial team, design portfolios, tool-marketing sites running “case studies” beside tutorials</span></div>
        <div class="tr"><code>R2</code><span><b>Paid native advertising</b> — a sponsored or brand-studio label, or the vendor speaking inside the article. Numbers do not redeem it</span></div>
        <div class="tr"><code>R3</code><span><b>Pure hype</b> — business outcomes only — no tool, platform, method or stack named anywhere</span></div>
        <div class="tr"><code>R8</code><span><b>Synthetic composite</b> — a customer assembled from several, or invented outright; judged by hand in the audit</span></div>
        <div class="tr"><code>R10</code><span><b>Partnership or MOU</b> — no deployment in the past tense anywhere in the piece</span></div>
        <div class="tr"><code>R12</code><span><b>Survey or market analysis</b> — research findings wearing a case study's headline</span></div>
        <div class="tr"><code>R13</code><span><b>Not about AI</b> — the story turns out to be about something else entirely</span></div>
      </div>
      <div class="tcol" style="--tc:#43cc93">
        <div class="th"><b>Accept</b><em>4</em></div>
        <div class="tr"><code>R4</code><span><b>Vendor blog with substance</b> — real technical detail, and the customer is named</span></div>
        <div class="tr"><code>R5</code><span><b>Built and run in-house</b> — a large organisation describing its own system</span></div>
        <div class="tr"><code>R6</code><span><b>Independent media</b> — reporting with technical detail</span></div>
        <div class="tr"><code>R7</code><span><b>Public sector or academic</b> — government, university or non-profit deployments</span></div>
      </div>
      <div class="tcol" style="--tc:#e8a33d">
        <div class="th"><b>Downgrade</b><em>2</em></div>
        <div class="tr"><code>R9</code><span><b>Anonymous customer</b> — the vendor is the only source — kept, confidence reduced</span></div>
        <div class="tr"><code>R14</code><span><b>Vendor self-publishing</b> — high risk by default, with written exceptions rather than case-by-case argument</span></div>
      </div>
      </div>

      <div class="tflow"><span class="line"></span><span>and a rejection has somewhere to go</span></div>

      <div class="tbar" style="--tc:#a78bfa">
        <div class="tlab"><i>Disposition</i><code>R15</code></div>
        <div class="tb">
          <b>Archived, never deleted</b>
          <p>An advertorial, a dead source or a fabricated record is retired rather than removed. The history stays auditable, and the URL is permanently blocked from re-entering — which is what stops the same bad article arriving again next week.</p>
        </div>
      </div>

      <div class="tflow" style="padding-top:26px"><span>a separate loop · run against stored cases, not candidates</span></div>

      <div class="taudits">
        <div class="taudit">
          <div class="h"><code>R16</code><b>Content drift</b></div>
          <p>What is stored no longer matches what the source says — the article was edited, softened or replaced after the case was recorded.</p>
        </div>
        <div class="taudit">
          <div class="h"><code>R17</code><b>URL now points elsewhere</b></div>
          <p>The link still resolves, but to a different article than the one the case was built from. Alive is not the same as correct.</p>
        </div>
      </div>

    </div></div>
      </div>
    </div>
  </section>
<section class="mx-ch mx-deep" data-nav="Rules" id="sec-rules">
    <div class="mx-wrap">
      <header class="mx-chh" data-scene="rules"><div class="mx-chh-c">
        <div class="mx-eyebrow"><span>The harness around them</span><b>Rules</b></div>
        <h2>A standard agents can follow is a standard<span class="fade"> written as thresholds</span></h2>
        <p class="mx-lede">"Good quality" is not executable. Every judgment here had to be turned into something with a number, a list, or a yes-or-no test attached. Without that, each day's run applies a slightly different bar, and the dataset drifts without anyone being able to say when.</p>
        <div class="mx-figs "><div><b style="color:var(--amber)">14</b><span>fields a record carries</span></div><div><b style="color:var(--amber)">4</b><span>judgements no field can carry</span></div><div><b style="color:var(--violet)">3</b><span>states the database allows</span></div><div><b style="color:var(--green)">76</b><span>industry values allowed</span></div></div>
    </div></header>
      <div class="mx-body" data-scene="dust">
      <div class="mx-sub"><h3>What a record must be</h3><span>fourteen fields · four judgements</span></div>
      <p class="mx-p">A candidate is not scored. It is admitted or rejected. Most of the rows below only check that a field is filled and within its limit. The last four decide whether the thing is a deployment at all. Every rejection carries a reason code, which is what makes a bad day diagnosable rather than just disappointing.</p>
      <div class="mx-rec">
        <div class="mx-rec-l" id="mxRec">
          <button class="rr" data-i="0" aria-expanded="true">
                <code class="nm">title</code>
                <span class="ct">English</span>
                <span class="rw">A brief name for the AI application — not the article headline verbatim.</span>
              </button><button class="rr" data-i="1" aria-expanded="false">
                <code class="nm">summary</code>
                <span class="ct hard">200+ chars</span>
                <span class="rw">Describes the deployment, not the organisation behind it.</span>
              </button><button class="rr" data-i="2" aria-expanded="false">
                <code class="nm">content</code>
                <span class="ct hard">500+ chars</span>
                <span class="rw">A real use-case description, never marketing copy. A non-English source is translated, never discarded.</span>
              </button><button class="rr" data-i="3" aria-expanded="false">
                <code class="nm">URL</code>
                <span class="ct hard">specific article</span>
                <span class="rw">A post, release or case study. Never a homepage, product or pricing page, never LinkedIn, never an academic repository.</span>
              </button><button class="rr" data-i="4" aria-expanded="false">
                <code class="nm">company_id</code>
                <span class="ct no">must resolve</span>
                <span class="rw">An anonymous deployment drops the whole case. Never null, never a generated name, never a consortium standing in for a business.</span>
              </button><button class="rr" data-i="5" aria-expanded="false">
                <code class="nm">industry</code>
                <span class="ct hard">1 of 76</span>
                <span class="rw">Chosen by the deploying organisation's primary business, not by what the AI does.</span>
              </button><button class="rr" data-i="6" aria-expanded="false">
                <code class="nm">published_at</code>
                <span class="ct">ISO-8601</span>
                <span class="rw">The article's own publication date, read from the page rather than assumed.</span>
              </button><button class="rr" data-i="7" aria-expanded="false">
                <code class="nm">country</code>
                <span class="ct">standardised</span>
                <span class="rw">The canonical country name, not whatever spelling the article used.</span>
              </button><button class="rr" data-i="8" aria-expanded="false">
                <code class="nm">city</code>
                <span class="ct hard">mandatory</span>
                <span class="rw">Where the deployment actually is.</span>
              </button><button class="rr" data-i="9" aria-expanded="false">
                <code class="nm">continent</code>
                <span class="ct">derived</span>
                <span class="rw">Checked for consistency with the country, not assumed.</span>
              </button><button class="rr" data-i="10" aria-expanded="false">
                <code class="nm">latitude / longitude</code>
                <span class="ct no">never 0 · 999 · null</span>
                <span class="rw">Looked up from the real city. On a globe a placeholder is not a missing value, it is a visible point in the wrong place.</span>
              </button><button class="rr" data-i="11" aria-expanded="false">
                <code class="nm">type</code>
                <span class="ct">enum</span>
                <span class="rw">Deployment — in real operation, with metrics. Experiment — a pilot. Research — academic or R&amp;D.</span>
              </button><button class="rr" data-i="12" aria-expanded="false">
                <code class="nm">source_name</code>
                <span class="ct">enum</span>
                <span class="rw">Media, company website, research report or analyst firm.</span>
              </button><button class="rr" data-i="13" aria-expanded="false">
                <code class="nm">status</code>
                <span class="ct hard">pending</span>
                <span class="rw">Always pending on insert. Only a human reviewer moves it from there.</span>
              </button><div class="sep">judgement</div><button class="rr j" data-i="14" aria-expanded="false">
                <b class="nm">Contamination</b>
                <span class="ct no">judgement</span>
                <span class="rw">Text that is mostly navigation, CTA, footer or cookie banner. Text that opens with a document tag fails immediately. PDFs are allowed; raw extraction artifacts are not.</span>
              </button><button class="rr j" data-i="15" aria-expanded="false">
                <b class="nm">Generic description</b>
                <span class="ct no">judgement</span>
                <span class="rw">Boilerplate with no named deployment — “leading provider of AI-powered solutions”.</span>
              </button><button class="rr j" data-i="16" aria-expanded="false">
                <b class="nm">Deployment vs news</b>
                <span class="ct no">judgement</span>
                <span class="rw">Future tense, partnership announcements, launches, government initiatives — anything with no measured outcome yet.</span>
              </button><button class="rr j" data-i="17" aria-expanded="false">
                <b class="nm">Scale announcement</b>
                <span class="ct no">judgement</span>
                <span class="rw">All four at once: the claim is a headcount, no business process is named, the tool is a general-purpose assistant, no operational metric is given.</span>
              </button>
        </div>
        <aside class="mx-rec-p"><div class="mx-k">The rule</div><div id="mxRule"></div></aside>
      </div>
      <div class="mx-sub"><h3>Three states, enforced by the database</h3><span>not a convention — a constraint</span></div>
      <p class="mx-p">The record state is not a string anyone can invent. The database itself allows exactly three values, so a wrong one cannot be written even by mistake.</p>
      <div class="mx-states">
        <div class="st" style="--sc:#e8a33d"><code>pending</code><b>Written by the pipeline, not yet reviewed</b><p>Rendered, but labelled <em style="font-style:normal;color:#e6edf7">To be validated</em> — visible is more useful than hidden, as long as nobody can mistake it for verified.</p></div>
        <div class="fork" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength="1" d="M0 50 C55 50 45 22 100 22" stroke="#43cc93"/><path pathLength="1" d="M0 50 C55 50 45 78 100 78" stroke="#f2607a"/></svg><span>human review</span></div>
        <div class="col"><div class="st" style="--sc:#43cc93"><code>published</code><b>Reviewed and approved</b><p>Rendered normally, everywhere in the product.</p></div><div class="st" style="--sc:#f2607a"><code>archived</code><b>Retired, kept for history and audit</b><p>Excluded from every frontend surface, and its URL is permanently blocked from re-entering.</p></div></div>
      </div>
      <p class="mx-p">Extending that set is explicitly a two-part change: the constraint and the display logic move together, or the product shows a state it does not understand.</p>
      </div>
    </div>
  </section>
<section class="mx-ch mx-deep" data-nav="Resilience" id="sec-res">
    <div class="mx-wrap">
      <header class="mx-chh" data-scene="res"><div class="mx-chh-c">
        <div class="mx-eyebrow"><span>The harness around them</span><b>Resilience</b></div>
        <h2>Designed around the assumption that things go wrong<span class="fade"> quietly</span></h2>
        <p class="mx-lede">The pipeline's failure handling was not designed in advance. Almost every rule in it is the scar tissue of a day that went wrong in a way nobody noticed — and every one of those days produced plausible output.</p><p class="mx-lede">Nothing crashed, nothing threw, and the run reported success. That is the hazard of a pipeline built on a language model and a set of external services: <em>the default failure mode is not an error, it is a confident, well-formed, wrong result.</em></p><p class="mx-lede">So the theme is not "retry harder" but "make the failure visible". The design spends far more on detecting silent failure — empty-as-error, mechanical checks, per-tool statistics, recorded reasons — than on recovering from loud failure, which was never the real risk.</p>

    </div></header>
      <div class="mx-body" data-scene="dust">
      <div class="mx-sub"><h3>Three standing rules</h3></div>
      <div class="mx-stand"><div><span>01</span><b>Fail forward, never halt</b><p>A stage that cannot do its job produces an empty result and the run continues. Halting would mean no report.</p></div><div><span>02</span><b>Treat emptiness as suspicious</b><p>A zero result from a tool is handled as a failure, not as an answer.</p></div><div><span>03</span><b>Record why, not just what</b><p>Counts tell you a day was bad. Reasons tell you whether to change the queries, the sources, or nothing at all.</p></div></div>
      <div class="mx-sub"><h3>Incidents that became rules</h3><span>each one failed quietly first</span></div>
      <div class="mx-inc">
        <article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>The same fixed queries ran for days and eventually returned nothing but articles already on record</p></div><div class="c1"><span>Why it went unnoticed</span><p>The run looked healthy — searches succeeded, candidates arrived, they were simply all duplicates</p></div><div class="c2"><span>The rule it produced</span><p>Queries rotate daily out of a much larger pool, so a question is not repeated for weeks</p></div></article><article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>A search tool hit its weekly quota and returned an empty success</p></div><div class="c1"><span>Why it went unnoticed</span><p>Nothing errored. The day was recorded as a day with no AI deployments in the world</p></div><div class="c2"><span>The rule it produced</span><p>Empty results trigger a fallback to a different tool, and the substitution is recorded</p></div></article><article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>The strongest search tool went weeks without being called</p></div><div class="c1"><span>Why it went unnoticed</span><p>A global fallback order meant the first tool almost always succeeded first</p></div><div class="c2"><span>The rule it produced</span><p>Each query layer has its own primary tool, so all of them stay in use and stay measurable</p></div></article><article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>Untranslated records reached the dataset</p></div><div class="c1"><span>Why it went unnoticed</span><p>The validator was confident it had translated them</p></div><div class="c2"><span>The rule it produced</span><p>A mechanical check scans the output for untranslated text before anything is written</p></div></article><article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>Seventeen vendor pages were recorded as deployments in one day</p></div><div class="c1"><span>Why it went unnoticed</span><p>Each one individually read like a case study</p></div><div class="c2"><span>The rule it produced</span><p>A second mechanical check screens for vendor domains, announcement phrasing and roundups</p></div></article><article data-s="0"><div class="viz"><span class="lamp"></span><canvas></canvas></div><div class="c0"><span>What happened</span><p>The review backlog was reported as far smaller than it was</p></div><div class="c1"><span>Why it went unnoticed</span><p>The count silently stopped at the first page of results</p></div><div class="c2"><span>The rule it produced</span><p>Backlog figures are counted at the source rather than tallied from a fetched list</p></div></article>
      </div>
      </div>
    </div>
  </section>
<section class="mx-ch mx-deep" data-nav="Knowledge" id="sec-src">
    <div class="mx-wrap">
      <header class="mx-chh" data-scene="know"><div class="mx-chh-c">
        <div class="mx-eyebrow"><span>The harness around them</span><b>Knowledge</b></div>
        <h2>Who owns which<span class="fade"> decision</span></h2>
        <p class="mx-lede">The pipeline's behaviour is not spread across code — it is written down in a set of documents, each of which is authoritative for one kind of decision. Select any of them to see what it decides and who reads it.</p>

    </div></header>
      <div class="mx-body" data-scene="dust">
      <div class="mx-know">
        <div class="kg">
          <div class="mx-k">Stage definitions <i>one per stage</i></div>
          <details><summary><span>Decides the shape of a run</span><b>Pipeline orchestration</b><i></i></summary><div class="kb"><p>Defines that a day is four stages in a fixed order sharing one identity, that a missing result becomes an empty result rather than a halt, and that the report is sent under all circumstances.</p><h6>Decides</h6><p>The order of the stages, what happens when one produces nothing, and the guarantee that the day always ends in a message.</p><h6>Explicitly does not decide</h6><p>Anything about searching, judging, recording or formatting. It owns the choreography and nothing else.</p><h6>Read by</h6><p>The scheduled daily run, which invokes it and nothing below it directly.</p></div></details><details><summary><span>Decides what gets asked</span><b>Search definition</b><i></i></summary><div class="kb"><p>Owns the query design: the three layers, the daily rotation, the shape a query must have, which tool answers which layer, and when to give up on a query.</p><h6>Decides</h6><p>Which questions today asks, how tools are chosen and substituted, and which links are discarded before anyone reads them.</p><h6>Explicitly does not decide</h6><p>Whether any candidate is a real use case. It is written to be mechanically followable so that it cannot start improvising.</p><h6>Consults</h6><p>The accumulated learnings record, the source list, and the environment notes, before it asks anything.</p></div></details><details><summary><span>Decides what is real</span><b>Validation definition</b><i></i></summary><div class="kb"><p>The largest and most contested document in the system. It holds the acceptance bar, the rejection families, the translation discipline, and the requirement that mechanical checks run over its own output.</p><h6>Decides</h6><p>Whether a candidate is a deployment, whether its company is identifiable, whether its facts are extractable, and how it is rendered in English.</p><h6>Explicitly does not decide</h6><p>Anything about storage. It produces a judgment and hands it on.</p><h6>Defers to</h6><p>The shared data standard for field-level rules, and the industry vocabulary for classification.</p><h6>Notable property</h6><p>It carries a running list of sources judged permanently unusable, so the same bad article cannot be reconsidered every week.</p></div></details><details><summary><span>Decides what already exists</span><b>Persistence definition</b><i></i></summary><div class="kb"><p>Owns identity and nothing else: whether an article has been recorded before, what a case must resolve before it can be stored, and what state it arrives in.</p><h6>Decides</h6><p>Duplicate detection, what a case must resolve before it is written, and the reviewed-or-not state it arrives in.</p><h6>Explicitly does not decide</h6><p>Quality. By the time this runs, quality has been settled and is not revisited.</p><h6>Defers to</h6><p>The shared data standard for every field it writes, including which fields may never be empty.</p></div></details><details><summary><span>Decides what gets said</span><b>Reporting definition</b><i></i></summary><div class="kb"><p>Owns the daily message: its structure, its wording on an empty day, the backlog thresholds, and the rule that the run is only archived once the message lands.</p><h6>Decides</h6><p>How the day is summarised, when the review backlog is escalated from a note to a warning, and what a zero day is told.</p><h6>Explicitly does not decide</h6><p>Anything it reports. It is strictly downstream and re-derives nothing.</p><h6>Consults</h6><p>The learnings record, so its observations are written against history rather than a single day.</p></div></details>
        </div><div class="kg">
          <div class="mx-k">Shared standards <i>read by more than one stage</i></div>
          <details><summary><span>Defines what a record must be</span><b>Data standard</b><i></i></summary><div class="kb"><p>The shared contract both the validator and the persistence stage answer to. It defines every field a use case carries, which of them may never be empty, and what the three record states mean throughout the product.</p><h6>Decides</h6><p>Field-level requirements, the meaning of unreviewed, published and retired, geographic standardisation, and minimum content standards.</p><h6>Why it is shared</h6><p>Two stages write against the same schema. Keeping the rules in one place is what stops them drifting apart, which is exactly how a dataset develops inconsistencies that are only visible years later.</p><h6>Notable rule</h6><p>Coordinates must be genuinely looked up. Placeholder values are prohibited, because on a globe a placeholder is not a missing value &mdash; it is a visible point in the wrong place.</p></div></details><details><summary><span>Defines the permitted values</span><b>Industry vocabulary</b><i></i></summary><div class="kb"><p>A single closed list of permitted industry values, and the sole authority for that field. The product generates its own copy from it rather than maintaining a parallel one.</p><h6>Decides</h6><p>Every value the industry field may take, plus two explicitly permitted non-standard entries for organisations that fit no commercial category.</p><h6>Design property</h6><p>The generation step verifies the count and refuses to write if it is wrong, so a malformed edit fails loudly rather than shipping a silently truncated vocabulary.</p><h6>Classification rule</h6><p>A case takes the industry of the organisation deploying it, not of the AI itself. A hospital using computer vision is healthcare.</p></div></details><details><summary><span>Remembers what has not worked</span><b>Learnings record</b><i></i></summary><div class="kb"><p>The pipeline’s memory. Running analysis of which queries produce nothing, which tools outperform which, and which quality problems keep recurring.</p><h6>Decides</h6><p>Nothing directly &mdash; it has no authority. But it is the input to almost every rule change, and every stage of the run reads it.</p><h6>Typical content</h6><p>Multi-day comparisons showing one search tool converting roughly ten times better than another, named queries with long zero streaks, and structural problems such as an entire language path being broken by malformed responses.</p><h6>Why it exists</h6><p>Without it, the same unproductive query gets rediscovered and re-added every few months.</p></div></details><details><summary><span>Remembers where not to look</span><b>Source list</b><i></i></summary><div class="kb"><p>The catalogue of publications worth searching, annotated with the ones that have stopped working and why.</p><h6>Decides</h6><p>Which parts of the web are worth the pipeline’s attention.</p><h6>Maintenance pattern</h6><p>A dead source is annotated in place with the date and the reason rather than deleted, so the history of why it was dropped survives &mdash; a domain blocked for a temporary outage is a different case from one whose DNS no longer resolves.</p></div></details><details><summary><span>Records what actually happened</span><b>Run history</b><i></i></summary><div class="kb"><p>One entry per completed day, written only after the report is confirmed delivered. The pipeline’s own evidence base.</p><h6>Decides</h6><p>Nothing. It is the measurement layer that makes every other decision reviewable.</p><h6>Why delivery-gated</h6><p>An entry means a day that finished and was communicated. A run that produced results but failed to report leaves a gap, which is the honest record of what the maintainer experienced.</p><h6>What it enables</h6><p>Every claim on this page about survival rates, tool performance and rejection patterns is read from this record.</p></div></details>
        </div><div class="kg">
          <div class="mx-k">Product & codebase <i>the side that is built, not run</i></div>
          <details><summary><span>Defines what the product is</span><b>Product specification</b><i></i></summary><div class="kb"><p>The description of the atlas as a product rather than as a pipeline: what it shows, who it is for, and which surfaces exist. Every decision about what to build is measured against it.</p><h6>Decides</h6><p>What the product contains, what each view is for, and what is deliberately out of scope.</p><h6>Explicitly does not decide</h6><p>Anything about how a case gets found or judged. It describes the destination, not the route.</p><h6>Read by</h6><p>Whoever is building a surface, before they decide what it should do.</p></div></details><details><summary><span>Decides what is safe to change</span><b>Codebase notes</b><i></i></summary><div class="kb"><p>The standing reference for the application side: which tables back which pages, which data functions are cached and which are not, how the routes map, and the failure modes this code has produced that returned valid output and raised nothing.</p><h6>Decides</h6><p>Where to look before changing anything, and which past mistakes not to repeat.</p><h6>Explicitly does not decide</h6><p>The data standard. It records how the app reads the data, not what the data must be.</p><h6>Notable property</h6><p>It is kept current as a rule: when a read contradicts it, the file is corrected in the same session.</p></div></details><details><summary><span>Decides how a change reaches readers</span><b>Cache runbook</b><i></i></summary><div class="kb"><p>The procedure for purging cached data and the map of which tag covers which surface. Without it a corrected record can stay invisible for a day, or a purge can cost far more than it needed to.</p><h6>Decides</h6><p>Which tag to purge for a given change, and in what order.</p><h6>Explicitly does not decide</h6><p>Whether the change itself was right.</p><h6>Read by</h6><p>Anyone who has just written to the database and needs the site to agree.</p></div></details>
        </div>
      </div>
      </div>
    </div>
  </section>
<section class="mx-ch mx-final" data-scene="globe" data-nav="Results" id="sec-out">
    <div class="mx-wrap"><div class="mx-final-c">
      <div class="mx-eyebrow"><b>Results</b></div>
      <h2>Six months of use cases, and two<span class="fade"> filters</span></h2>
      <p class="mx-lede">April through early September, read from the database itself and from the pipeline's own run log. Two things are worth separating: what the pipeline discards before writing a case down, and what review discards afterwards. Both are large, and only the first was designed.</p>
      <div class="mx-figs four"><div><b style="color:var(--violet)">1,718</b><span>recorded all-time</span></div><div><b style="color:var(--cyan)">1,560</b><span>recorded since April</span></div><div><b style="color:var(--green)">700</b><span>published after human-in-the-loop review</span></div><div><b style="color:var(--amber)">0</b><span>awaiting review</span></div></div>
      <p class="mx-note">Counted at the source on 15 September 2026.</p>
      <div class="mx-k">Use cases recorded, April to September</div>
      <div class="mx-months">
        <div><span class="tot">379</span><i class="arc" style="height:32.3%"></i><i class="pub" style="height:48.2%"></i><span class="mo">Apr</span></div><div><span class="tot">91</span><i class="arc" style="height:0.4%"></i><i class="pub" style="height:18.9%"></i><span class="mo">May</span></div><div><span class="tot">471</span><i class="arc" style="height:60.1%"></i><i class="pub" style="height:39.9%"></i><span class="mo">Jun</span></div><div><span class="tot">172</span><i class="arc" style="height:28.2%"></i><i class="pub" style="height:8.3%"></i><span class="mo">Jul</span></div><div><span class="tot">287</span><i class="arc" style="height:50.5%"></i><i class="pub" style="height:10.4%"></i><span class="mo">Aug</span></div><div><span class="tot">160</span><i class="arc" style="height:30.8%"></i><i class="pub" style="height:3.2%"></i><span class="mo">Sep</span></div>
      </div>
      <div class="mx-leg"><span class="pub">Published after review</span><span class="arc">Archived after review</span></div>
      <div class="mx-close">
        <p>Everything that survives all of this ends up on one map.</p>
        <a href="/">Explore AI Atlas <span>→</span></a>
      </div>
    </div></div>
  </section>`
