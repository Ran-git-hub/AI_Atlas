"use client"

import { useEffect, useRef } from "react"

import "./methodology.css"

/**
 * The methodology page body.
 *
 * Markup and behaviour are authored as one self-contained document
 * (`reports/daily-ai-push-pipeline-onepage.html`) because the page is a single
 * designed artefact — an interactive pan/zoom map, a scroll-spy nav and two SVG
 * charts sharing one palette. Re-expressing 79 KB of static markup as JSX would
 * buy nothing and risk transcription errors, so it is injected verbatim and the
 * behaviour runs once on mount.
 *
 * Four things are handled deliberately:
 *  - the styles are a real stylesheet rather than an injected <style> string:
 *    rendering 43 KB of CSS through React made the server and client trees
 *    disagree and cost a hydration pass on every load;
 *  - every selector in it is scoped under `.mth`, so the document's
 *    element-level rules (h1, p, table, ...) cannot reach the rest of the app;
 *  - every DOM lookup in the behaviour is scoped to this component's root, so
 *    it cannot bind to the shared chrome around it;
 *  - the element helper is named `__el` because the canvas engine already has a
 *    `byId` of its own, and the shadowing broke every lookup inside it;
 *  - MARKUP has to be tag-balanced. One stray `</div>` closed this container
 *    early, so the server DOM put the rest of the page — and the footer — beside
 *    it instead of inside it, which React reported as a hydration mismatch.
 */
const MARKUP = `<header class="topbar">
  <div class="topbar-in">
    <div class="steps" aria-label="Sections, in reading order">
      <div class="ngrp solo">
        <span class="glab"></span>
        <div class="grow"><button class="navstep" data-go="ov">Overview</button></div>
      </div>
      <span class="tick joint"></span>
      <div class="ngrp">
        <span class="glab">The skills</span>
        <div class="grow">
          <button class="navstep" data-go="s1" style="--accent:#a78bfa"><i>01</i>Search</button>
          <span class="tick"></span>
          <button class="navstep" data-go="s2" style="--accent:#e8a33d"><i>02</i>Validate</button>
          <span class="tick"></span>
          <button class="navstep" data-go="s3" style="--accent:#43cc93"><i>03</i>Persist</button>
          <span class="tick"></span>
          <button class="navstep" data-go="s4" style="--accent:#22d3ee"><i>04</i>Report</button>
        </div>
      </div>
      <span class="tick joint"></span>
      <div class="ngrp">
        <span class="glab">The harness around them</span>
        <div class="grow">
          <button class="navstep" data-go="bar">Quality bar</button>
          <span class="tick"></span>
          <button class="navstep" data-go="rules">Rules</button>
          <span class="tick"></span>
          <button class="navstep" data-go="res">Resilience</button>
          <span class="tick"></span>
          <button class="navstep" data-go="src">Knowledge</button>
        </div>
      </div>
      <span class="tick joint"></span>
      <div class="ngrp solo">
        <span class="glab"></span>
        <div class="grow"><button class="navstep" data-go="out">Results</button></div>
      </div>
    </div>

  </div>
</header>

<div class="pagemain">

<!-- ==================== THE FLOW ==================== -->
<section class="sec" id="sec-ov">
  <div class="hero">
    <div class="hero-l">
      <div class="sectitle"><b>Methodology &amp; Agents</b></div>
      <h1>Agents find it. Harnesses filter it. <span class="fade">A human publishes it.</span></h1>
      <p class="lede">AI Atlas records where AI is actually deployed in the real world &mdash; which company, which process, what changed, and what was measured.</p>
      <p class="lede">Every day, agents search the open web and filter out <b>85%</b>: announcements, vendor brochures, roundups, anything with no named company or no measured outcome. A human reviewer reads the <b>15%</b> that survives and decides what is worth publishing &mdash; the last <b>6%</b>.</p>
      <p class="lede">A repository of real AI deployments, for research, insight and inspiration.</p>
    </div>

    <div class="funnel">
      <div class="fstep">
        <div class="row"><span class="v" style="color:var(--violet)">~11,400</span><span class="l">candidates found in total</span></div>
        <div class="bar" style="width:100%;background:var(--violet)"></div>
      </div>
      <div class="fstep">
        <div class="row"><span class="v" style="color:var(--amber)">1,718</span><span class="l">passed the agents' daily validation</span></div>
        <div class="bar" style="width:15.1%;background:var(--amber)"></div>
      </div>
      <div class="fstep">
        <div class="row"><span class="v" style="color:var(--green)">700</span><span class="l">published after human-in-the-loop review</span></div>
        <div class="bar" style="width:6.1%;background:var(--green)"></div>
      </div>
      <p class="fnote">Counted from 22 March 2026 to 15 September 2026.</p>
    </div>
  </div>

  <div class="band">
    <div class="band-h">
      <h2>The multi-agent architecture</h2>
      <span class="label">drag &middot; zoom &middot; select any node</span>
    </div>
    <div class="canvas-frame" id="cvFrame">
      <svg id="cv" role="img" aria-label="Interactive map of the pipeline: sources, four stages, discard paths, the atlas, and review"></svg>
      <div class="cv-tools">
        <button class="cv-btn" id="cvOut" aria-label="Zoom out">&minus;</button>
        <button class="cv-btn" id="cvIn" aria-label="Zoom in">+</button>
        <button class="cv-btn" id="cvFit">Fit</button>
      </div>
      <div class="cv-hint"><span class="wide">DRAG TO PAN &middot; SCROLL TO ZOOM &middot; SELECT ANY NODE</span><span class="narrow">DRAG SIDEWAYS TO EXPLORE &middot; TAP ANY NODE</span></div>
      <aside class="cv-panel" id="cvPanel" aria-live="polite">
        <div class="cv-panel-h">
          <div style="min-width:0">
            <div class="r" id="cvRole">&mdash;</div>
            <h3 id="cvTitle">&mdash;</h3>
          </div>
          <button class="cv-panel-x" id="cvClose" aria-label="Close">&times;</button>
        </div>
        <div class="cv-panel-b" id="cvBody"></div>
      </aside>
    </div>
    <div class="cv-legend below">
      <b>WHO OWNS IT</b>
      <span><i class="own" style="border-color:#22d3ee"></i>Ops &middot; Hermes Agent</span>
      <span><i class="own" style="border-color:#43cc93"></i>PM &middot; OpenClaw Agent</span>
      <b class="gap">WHAT MOVES</b>
      <span><i style="background:#a78bfa"></i>candidates</span>
      <span><i style="background:#43cc93"></i>survivors</span>
      <span><i style="background:#f2607a"></i>discarded</span>
      <span><i style="background:#2a3a55"></i>reference &amp; feedback</span>
    </div>
  </div>

  <div class="band">
    <div class="band-h"><h2>The four principles the whole design rests on</h2><span class="label">what every other decision follows from</span></div>
    <div class="cols4">
      <div class="seq">
        <span class="n">01</span>
        <div class="seq-b">
          <b>One job per stage, and a hard boundary around it</b>
          <p class="lead">Every stage may do exactly one thing &mdash; and is forbidden from its neighbour's.</p>
          <p class="body">Search may reject an obviously bad link but never opens the article. Validation judges and never writes. Persistence writes and never re-judges. Reporting only reads. Each boundary sits where the decision on the other side of it is actually accountable, because a stage that quietly does a neighbour's job is a stage whose failures cannot be attributed.</p>
        </div>
      </div>
      <div class="seq">
        <span class="n">02</span>
        <div class="seq-b">
          <b>The pipeline may fail; the report may not</b>
          <p class="lead">A day that finds nothing still says which kind of nothing it found.</p>
          <p class="body">Every stage hands the next one something, even when that something is empty, and a stage that produces nothing does not halt the run. Nothing searched means a tool broke; nothing survived means the questions were badly aimed; everything already on record means the queries have saturated. Silence would be indistinguishable from a crash.</p>
        </div>
      </div>
      <div class="seq">
        <span class="n">03</span>
        <div class="seq-b">
          <b>When in doubt, reject</b>
          <p class="lead">A missed case is recoverable. A false one is not.</p>
          <p class="body">A case that should have been captured can be found again tomorrow. A vendor brochure recorded as a deployment sits in the dataset and on the globe until someone notices. The asymmetry is deliberate, and it is why more than eight in ten candidates are discarded on a normal day.</p>
        </div>
      </div>
      <div class="seq">
        <span class="n">04</span>
        <div class="seq-b">
          <b>Deterministic checks verify the model's judgment</b>
          <p class="lead">The model is trusted to judge. It is not trusted to be the last word.</p>
          <p class="body">The reading and the reasoning are the part only it can do. But it fails in known, repeatable ways &mdash; it forgets to translate, it accepts a vendor's own product page as a customer deployment &mdash; so its output passes through mechanical checks before anything is written down.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Where a human sits in the loop</h2><span class="label">nothing publishes itself</span></div>
    <p class="body" style="max-width:82ch">The pipeline never publishes on its own authority. Everything it records arrives in an unreviewed state and waits for review.</p>
    <div class="dl two" style="margin-top:20px">
        <div>
          <span class="what">Cases arrive labelled, not hidden</span>
          <span class="why">They are visible in the product from the moment they are written, but carry a label saying they are not yet validated.</span>
        </div>
        <div>
          <span class="what">A reviewer decides, never the pipeline</span>
          <span class="why">Each case is approved or rejected by hand in the dashboard. Nothing the pipeline writes promotes itself.</span>
        </div>
        <div>
          <span class="what">The report watches the queue</span>
          <span class="why">It surfaces the size of the review backlog and hardens its wording as that backlog grows, so the system can say when review has fallen behind.</span>
        </div>
        <div>
          <span class="what">Rejection is retirement, not deletion</span>
          <span class="why">A rejected case is kept for history and its source is permanently off-limits, so the same bad article cannot come back next week.</span>
        </div>
    </div>
  </div>
</section>

<!-- ==================== STAGE 1 ==================== -->
<section class="sec stage" id="sec-s1">
  <div class="stepper" role="tablist" aria-label="The four stages">
    <span class="cap">The skills</span>
    <button class="step now" data-go="s1" style="--sc:var(--violet)"><span class="track"></span><span class="meta"><span class="num">01</span><span class="nm">Search</span></span></button>
    <button class="step" data-go="s2" style="--sc:var(--amber)"><span class="track"></span><span class="meta"><span class="num">02</span><span class="nm">Validate</span></span></button>
    <button class="step" data-go="s3" style="--sc:var(--green)"><span class="track"></span><span class="meta"><span class="num">03</span><span class="nm">Persist</span></span></button>
    <button class="step" data-go="s4" style="--sc:var(--cyan)"><span class="track"></span><span class="meta"><span class="num">04</span><span class="nm">Report</span></span></button>
  </div>
  <div class="stagegrid">
    <div class="rail">
      <div class="rail-id">
        <div class="stage-id">
          <span class="big" style="color:var(--violet)">01</span>
          <div class="txt">
            <span class="of">Stage one of four</span>
            <h1 class="sm">Search</h1>
          </div>
        </div>
        <p class="lede" style="font-size:17px">Produces a list of links worth reading, and is deliberately kept ignorant of what those links say &mdash; because a searcher that starts forming opinions about content will discard things the validator would have caught, on far less evidence.</p>
      </div>
      <div class="duty">
        <div class="can">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.4 6.2 11.6 13 4.8" stroke="#43cc93" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="color:var(--green)">Responsible for</span>
          </div>
          <ul>
            <li>Deciding which queries today should ask</li>
            <li>Choosing which tool answers each one, and recovering when a tool goes quiet</li>
            <li>Discarding links that structurally cannot be a case study</li>
            <li>Removing duplicates and normalising what survives</li>
          </ul>
        </div>
        <div class="cant">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6" stroke="#f2607a" stroke-width="1.7" stroke-linecap="round"/></svg>
            <span style="color:var(--rose)">Forbidden from</span>
          </div>
          <ul>
            <li>Opening an article and reading it</li>
            <li>Treating a search snippet as if it were the article</li>
            <li>Repairing a broken link or inventing a missing title</li>
            <li>Improvising extra queries beyond what the day calls for</li>
          </ul>
        </div>
      </div>
      <div class="figs">
        <div class="fig"><span class="v" style="color:var(--violet)">3</span><span class="l">query layers</span></div>
        <div class="fig"><span class="v" style="color:var(--violet)">14</span><span class="l">searches a day</span></div>
        <div class="fig"><span class="v" style="color:var(--violet)">2</span><span class="l">retries, then stop</span></div>
      </div>
    </div>

    <div>
      <div class="band-h" style="padding-bottom:6px"><h2>Design decisions</h2><span class="label">and what each one answers</span></div>

      <div class="seq">
        <span class="n" style="color:var(--violet)">D1</span>
        <div class="seq-b">
          <b>Three query layers, aimed at three different blind spots</b>
          <p class="body">Searching one way finds one kind of case. The layers exist so that no single dimension of coverage can quietly collapse.</p>
          <div class="tw"><table>
            <thead><tr><th>Layer</th><th>Asks about</th><th>Guards against</th></tr></thead>
            <tbody>
              <tr><td><span class="pill p-v">Process</span></td><td>Specific business workflows &mdash; claims, fraud review, code review, contact centre</td><td>Missing the ordinary, unglamorous deployments that make up most real adoption</td></tr>
              <tr><td><span class="pill p-i">Industry</span></td><td>A different sector each day of the week</td><td>The dataset skewing toward whichever industries publish most loudly</td></tr>
              <tr><td><span class="pill p-ok">Geography</span></td><td>A rotating set of countries each day</td><td>An atlas that is really just a map of the United States</td></tr>
            </tbody>
          </table></div>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--violet)">D2</span>
        <div class="seq-b">
          <b>Every query must name a process, a deployment, and a number</b>
          <p class="body">A query that asks only about "AI" returns opinion. The shape that works asks for all three at once: a concrete business process, a word that means the thing is actually running, and a word that implies a measured outcome. That triple is the cheapest available proxy for the distinction the validator will later have to make properly &mdash; between something a company <em>announced</em> and something a company <em>does</em>. Queries that drop any leg of the triple have been measured at a zero percent survival rate.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--violet)">D3</span>
        <div class="seq-b">
          <b>Queries rotate daily out of a larger pool</b>
          <p class="body">A fixed set of queries stops working after about three days: it keeps finding the same articles, which are by then already on record, and the run's entire output becomes duplicates. Rotation ensures the same question does not repeat for weeks. The selection derives from the date, so it is deterministic and reproducible &mdash; the same day always asks the same questions, which matters when you are trying to explain why a particular day found nothing.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--violet)">D4</span>
        <div class="seq-b">
          <b>Each layer has its own preferred search tool</b>
          <p class="body">Originally every query tried the tools in one fixed order, falling through on failure. The effect was that the cheapest tool answered almost everything and the strongest semantic search was never reached at all &mdash; it went weeks without being called once. Assigning each layer a primary tool forces all of them into use, and a measured comparison showed the previously-starved tool producing several times more surviving candidates than the chain it was buried under.</p>
        </div>
      </div>

      <div class="seq" style="border-bottom:1px solid var(--hair)">
        <span class="n" style="color:var(--violet)">D5</span>
        <div class="seq-b">
          <b>Fall back on silence, not only on errors</b>
          <p class="body">The failure that shaped this rule was a tool hitting its weekly quota and returning that as a successful response containing zero results. Nothing crashed, nothing was logged as broken, and the day simply recorded that the world had produced no AI deployments. Empty is now treated as a failure signal in its own right, alongside rate limits, timeouts and unparseable responses. A rerun through a different tool recovered twenty candidates and a real case that would otherwise have been lost silently.</p>
          <p class="body">The retry budget stops at two attempts per query. Beyond that the query is abandoned and recorded as abandoned &mdash; a run that takes all day to fail is worse than one that reports a gap.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== STAGE 2 ==================== -->
<section class="sec stage" id="sec-s2">
  <div class="stepper" role="tablist" aria-label="The four stages">
    <span class="cap">The skills</span>
    <button class="step done" data-go="s1" style="--sc:var(--violet)"><span class="track"></span><span class="meta"><span class="num">01</span><span class="nm">Search</span></span></button>
    <button class="step now" data-go="s2" style="--sc:var(--amber)"><span class="track"></span><span class="meta"><span class="num">02</span><span class="nm">Validate</span></span></button>
    <button class="step" data-go="s3" style="--sc:var(--green)"><span class="track"></span><span class="meta"><span class="num">03</span><span class="nm">Persist</span></span></button>
    <button class="step" data-go="s4" style="--sc:var(--cyan)"><span class="track"></span><span class="meta"><span class="num">04</span><span class="nm">Report</span></span></button>
  </div>
  <div class="stagegrid">
    <div class="rail">
      <div class="rail-id">
        <div class="stage-id">
          <span class="big" style="color:var(--amber)">02</span>
          <div class="txt">
            <span class="of">Stage two of four</span>
            <h1 class="sm">Validate</h1>
          </div>
        </div>
        <p class="lede" style="font-size:17px">The stage the whole pipeline exists to protect. Everything upstream is cheap and everything downstream is mechanical &mdash; this is where judgment happens, and its posture is adversarial: every candidate is marketing until the article proves otherwise.</p>
      </div>
      <div class="duty">
        <div class="can">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.4 6.2 11.6 13 4.8" stroke="#43cc93" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="color:var(--green)">Responsible for</span>
          </div>
          <ul>
            <li>Actually fetching and reading each article</li>
            <li>Deciding whether it describes a deployment at all</li>
            <li>Extracting company, place, industry and outcome, in English</li>
            <li>Recording <em>why</em> each rejection was rejected</li>
          </ul>
        </div>
        <div class="cant">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6" stroke="#f2607a" stroke-width="1.7" stroke-linecap="round"/></svg>
            <span style="color:var(--rose)">Forbidden from</span>
          </div>
          <ul>
            <li>Writing anything to the database</li>
            <li>Inventing a fact the article does not contain</li>
            <li>Keeping a case whose company cannot be identified</li>
            <li>Rejecting a source for the language it is written in</li>
          </ul>
        </div>
      </div>
      <div class="figs">
        <div class="fig"><span class="v" style="color:var(--amber)">10</span><span class="l">rules, all must pass</span></div>
        <div class="fig"><span class="v" style="color:var(--rose)">91.8%</span><span class="l">rejected, last run</span></div>
        <div class="fig"><span class="v" style="color:var(--green)">2</span><span class="l">machine re-checks</span></div>
      </div>
    </div>

    <div>
      <div class="band-h" style="padding-bottom:6px"><h2>Design decisions</h2><span class="label">and what each one answers</span></div>

      <div class="seq">
        <span class="n warm">D1</span>
        <div class="seq-b">
          <b>Language is a translation problem, never a quality signal</b>
          <p class="body">A Chinese power-grid deployment and a Japanese bank rollout are first-class cases. The source may be in any language; the output must be English &mdash; so a non-English article is translated, not discarded. This is enforced mechanically because the failure runs both ways: told "output must be English", a model starts throwing away perfectly good foreign-language sources; told "translate everything", it sometimes leaves the original text in place. Both have happened.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n warm">D2</span>
        <div class="seq-b">
          <b>The hardest filter is deployment versus announcement</b>
          <p class="body">Most of what the web publishes about enterprise AI is a press release about intent. It shares almost every word with a real case study &mdash; the same company names, the same "AI", the same "deployed". The distinction comes down to verb tense.</p>
          <div class="split">
            <div>
              <span class="label" style="color:var(--rose)">Reject pattern</span>
              <p style="color:#98a9c0">will enable &middot; is set to &middot; announces a partnership &middot; launches &middot; no metric yet</p>
            </div>
            <div>
              <span class="label" style="color:var(--green)">Accept pattern</span>
              <p style="color:var(--bright)">deployed at &middot; in production &middot; reduced review time 40% &middot; saved 6 hours per case</p>
            </div>
          </div>
        </div>
      </div>

      <div class="seq">
        <span class="n warm">D3</span>
        <div class="seq-b">
          <b>Scale is not a use case</b>
          <p class="body">"Two hundred thousand employees now have access to an AI assistant" is a real, verifiable, well-sourced fact, and it says nothing about how anyone's work changed. The bar is set explicitly: headcount announcements are not use cases and carry no meaning for the atlas. The same company becomes acceptable the moment the article names a process &mdash; claims handling, document review, fraud triage &mdash; and what changed about it.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n warm">D4</span>
        <div class="seq-b">
          <b>A named company, or nothing at all</b>
          <p class="body">Anonymous case studies &mdash; "a leading European insurer" &mdash; are dropped entirely rather than recorded with a blank. The temptation for a model is to infer a plausible name, and a single fabricated company would undermine every other record in the dataset. Consortiums, alliances, initiatives and project names are likewise not companies. The atlas is a map of who is doing this, and a point on it that names nobody is worse than an empty space.</p>
        </div>
      </div>


      <div class="seq" style="border-bottom:1px solid var(--hair)">
        <span class="n warm">D5</span>
        <div class="seq-b">
          <b>The model's output is checked by something that cannot be persuaded</b>
          <p class="body">After the validator finishes, mechanical checks run over its output looking for the specific ways it is known to fail: untranslated text left in place, vendor press domains accepted as sources, announcement phrasing, roundups and listicles, missing geography. Anything they catch is moved into the rejected pile before persistence sees it. These exist because on two separate days the validator was confident and wrong &mdash; once shipping untranslated records, once shipping seventeen vendor pages. They are not optional and are not skipped when the output "looks fine", since looking fine is exactly the failure mode.</p>
        </div>
      </div>
    </div>
  </div>
</section>
<!-- ==================== STAGE 3 ==================== -->
<section class="sec stage" id="sec-s3">
  <div class="stepper" role="tablist" aria-label="The four stages">
    <span class="cap">The skills</span>
    <button class="step done" data-go="s1" style="--sc:var(--violet)"><span class="track"></span><span class="meta"><span class="num">01</span><span class="nm">Search</span></span></button>
    <button class="step done" data-go="s2" style="--sc:var(--amber)"><span class="track"></span><span class="meta"><span class="num">02</span><span class="nm">Validate</span></span></button>
    <button class="step now" data-go="s3" style="--sc:var(--green)"><span class="track"></span><span class="meta"><span class="num">03</span><span class="nm">Persist</span></span></button>
    <button class="step" data-go="s4" style="--sc:var(--cyan)"><span class="track"></span><span class="meta"><span class="num">04</span><span class="nm">Report</span></span></button>
  </div>
  <div class="stagegrid">
    <div class="rail">
      <div class="rail-id">
        <div class="stage-id">
          <span class="big" style="color:var(--green)">03</span>
          <div class="txt">
            <span class="of">Stage three of four</span>
            <h1 class="sm">Persist</h1>
          </div>
        </div>
        <p class="lede" style="font-size:17px">By this point every judgment about the case has been made. This stage is deliberately mechanical &mdash; its only intelligence is about identity: has this article already been recorded, and does everything the case needs to exist actually resolve?</p>
      </div>
      <div class="duty">
        <div class="can">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.4 6.2 11.6 13 4.8" stroke="#43cc93" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="color:var(--green)">Responsible for</span>
          </div>
          <ul>
            <li>Recognising an article the atlas has already seen</li>
            <li>Storing the case whole &mdash; its text, not just a link to it</li>
            <li>Writing it down in a state that awaits review</li>
            <li>Handing reporting an accurate account of what it did</li>
          </ul>
        </div>
        <div class="cant">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6" stroke="#f2607a" stroke-width="1.7" stroke-linecap="round"/></svg>
            <span style="color:var(--rose)">Forbidden from</span>
          </div>
          <ul>
            <li>Reconsidering whether a case is good</li>
            <li>Promoting anything to published on its own authority</li>
            <li>Halting the run because one record failed to write</li>
          </ul>
        </div>
      </div>
      <div class="figs">
        <div class="fig"><span class="v" style="color:var(--green)">500+</span><span class="l">characters stored per case</span></div>
        <div class="fig"><span class="v" style="color:var(--green)">1</span><span class="l">case per source article</span></div>
        <div class="fig"><span class="v" style="color:var(--amber)">0</span><span class="l">auto-published</span></div>
      </div>
    </div>

    <div>
      <div class="band-h" style="padding-bottom:6px"><h2>Design decisions</h2><span class="label">and what each one answers</span></div>

      <div class="seq">
        <span class="n" style="color:var(--green)">D1</span>
        <div class="seq-b">
          <b>Deduplication ignores whether the earlier record was any good</b>
          <p class="body">If an article is already on record it is skipped &mdash; including when that earlier record was reviewed and retired. This is counter-intuitive but deliberate: retired means someone looked at this source and judged it invalid. Re-ingesting it would mean overruling a human decision automatically, every week, forever. Reviving a retired case is a manual act, never an automatic one.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--green)">D2</span>
        <div class="seq-b">
          <b>A case is stored whole, and keeps a pointer to its source</b>
          <p class="body">The record keeps the deployment's full text &mdash; five hundred characters at minimum &mdash; rather than a link and a headline. Articles rot: they get retracted, paywalled, restructured, or quietly rewritten to say something softer. A case that lives only as a URL is a case that can evaporate without anyone touching the database.</p>
          <p class="body">It also makes a specific repair possible. When an article turns out to be poor but the deployment behind it is worth keeping, there is a dedicated procedure to find a better source and attach it, instead of discarding the case and hoping the same deployment surfaces again.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--green)">D3</span>
        <div class="seq-b">
          <b>A case exists only once everything it points at resolves</b>
          <p class="body">A use case is not a standalone note. It carries a deployer, a place, an industry and a source, and each of those has to resolve to something real before the case can be written &mdash; a named organisation the atlas can attach it to, coordinates that put it somewhere on the globe, an industry drawn from the closed vocabulary. A field that does not resolve sends the case back; it is never filled with a blank.</p>
          <p class="body">A retired case is never revived automatically. It was retired because that article was judged bad, and nothing about a later day makes it good.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n" style="color:var(--green)">D4</span>
        <div class="seq-b">
          <b>New cases arrive unreviewed, on purpose</b>
          <p class="body">A case is written in a state that means "awaiting review". It is visible in the product but carries a label saying so, which is a deliberate trade: showing it unverified is more useful than hiding it, as long as nobody can mistake it for verified. The pipeline never promotes its own work.</p>
        </div>
      </div>

      <div class="seq" style="border-bottom:1px solid var(--hair)">
        <span class="n" style="color:var(--green)">D5</span>
        <div class="seq-b">
          <b>One bad case never takes down the day</b>
          <p class="body">A malformed field is corrected and retried; a network failure is retried once. If a case still cannot be written it is skipped and recorded as skipped, and the run continues with the rest. The stage always hands something onward, even when it wrote nothing at all &mdash; because the alternative is a day that ends in silence, and silence is the one outcome the design does not permit.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== STAGE 4 ==================== -->
<section class="sec stage" id="sec-s4">
  <div class="stepper" role="tablist" aria-label="The four stages">
    <span class="cap">The skills</span>
    <button class="step done" data-go="s1" style="--sc:var(--violet)"><span class="track"></span><span class="meta"><span class="num">01</span><span class="nm">Search</span></span></button>
    <button class="step done" data-go="s2" style="--sc:var(--amber)"><span class="track"></span><span class="meta"><span class="num">02</span><span class="nm">Validate</span></span></button>
    <button class="step done" data-go="s3" style="--sc:var(--green)"><span class="track"></span><span class="meta"><span class="num">03</span><span class="nm">Persist</span></span></button>
    <button class="step now" data-go="s4" style="--sc:var(--cyan)"><span class="track"></span><span class="meta"><span class="num">04</span><span class="nm">Report</span></span></button>
  </div>
  <div class="stagegrid">
    <div class="rail">
      <div class="rail-id">
        <div class="stage-id">
          <span class="big" style="color:var(--cyan)">04</span>
          <div class="txt">
            <span class="of">Stage four of four</span>
            <h1 class="sm">Report</h1>
          </div>
        </div>
        <p class="lede" style="font-size:17px">The pipeline's contract with its maintainer. The least sophisticated stage and the least optional one: a day that finds nothing still ends with a message, because an absent message means something broke and nobody knows what.</p>
      </div>
      <div class="duty">
        <div class="can">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.4 6.2 11.6 13 4.8" stroke="#43cc93" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="color:var(--green)">Responsible for</span>
          </div>
          <ul>
            <li>Summarising the day: added, already known, failed</li>
            <li>Showing which tools did the work, so a quiet tool is visible early</li>
            <li>Listing each new case in a form a reviewer can act on</li>
            <li>Surfacing the review backlog, and escalating as it grows</li>
          </ul>
        </div>
        <div class="cant">
          <div class="hd">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6" stroke="#f2607a" stroke-width="1.7" stroke-linecap="round"/></svg>
            <span style="color:var(--rose)">Forbidden from</span>
          </div>
          <ul>
            <li>Re-opening any article</li>
            <li>Re-checking content or re-validating a case</li>
            <li>Recomputing numbers the earlier stages established</li>
          </ul>
          <p class="body" style="font-size:14px;margin-top:4px">The single exception is a counts-only look at the database, purely to say how large the review queue has become.</p>
        </div>
      </div>
      <div class="figs">
        <div class="fig"><span class="v" style="color:var(--cyan)">1</span><span class="l">message a day, always</span></div>
        <div class="fig"><span class="v" style="color:var(--amber)">50</span><span class="l">pending before it warns</span></div>
        <div class="fig"><span class="v" style="color:var(--green)">0</span><span class="l">articles re-opened</span></div>
      </div>
    </div>

    <div>
      <div class="band-h" style="padding-bottom:6px"><h2>Design decisions</h2><span class="label">and what each one answers</span></div>

      <div class="seq">
        <span class="n">D1</span>
        <div class="seq-b">
          <b>A zero day still gets a report, and says which zero it was</b>
          <p class="body">There are several ways for a day to produce nothing, and they call for completely different responses. Nothing was searched means a tool is broken. Nothing survived validation means the day's questions were poorly aimed. Everything was already on record means the queries have saturated and need rotating. Collapsing all three into "no results" would throw away the only signal that says what to fix.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n">D2</span>
        <div class="seq-b">
          <b>The report watches the human, not just the machine</b>
          <p class="body">Because everything the pipeline records waits for review, the review queue is a real bottleneck &mdash; and one the pipeline can see but not fix. So the daily message reports the backlog and changes its tone as it grows, from a note to a warning. The pipeline is designed to be able to say that it is producing faster than it is being reviewed.</p>
        </div>
      </div>

      <div class="seq">
        <span class="n">D3</span>
        <div class="seq-b">
          <b>A run is counted only once the message actually lands</b>
          <p class="body">The day's metrics are archived after delivery is confirmed, never before. This makes the metrics history mean something precise: every line in it is a run that completed and was communicated. A run that produced cases but failed to report leaves no line, which is correct &mdash; from the maintainer's point of view that day did not happen, and the gap in the record is the honest representation of that.</p>
        </div>
      </div>

      <div class="seq" style="border-bottom:1px solid var(--hair)">
        <span class="n">D4</span>
        <div class="seq-b">
          <b>Reporting reads the same learnings the searcher does</b>
          <p class="body">The observations at the end of each report are written against the accumulated record of what has and has not been working, not off the day in isolation. That shared reference is what turns a daily message into a feedback loop: patterns noticed in reports become notes, notes become retired queries and new rules, and those rules change what tomorrow's search asks.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== QUALITY BAR ==================== -->
<section class="sec" id="sec-bar">
  <div class="hero side">
    <div class="hero-l">
      <div class="sectitle"><span class="grp">The harness around them:</span><b>Quality bar</b></div>
      <h1>What counts as a use case, and what only<span class="fade"> looks like one</span></h1>
      <p class="lede">Nearly every design decision in the pipeline is downstream of this definition. It is worth stating plainly, because most of what the web publishes about enterprise AI fails it.</p>
    </div>
    <div class="funnel">
      <span class="label">A case qualifies when</span>
      <ul class="list" style="gap:11px;font-size:15.2px;padding-left:0;list-style:none">
        <li><b>A named company</b> is doing it &mdash; a real business entity, not a consortium or project name</li>
        <li>It is <b>running</b>, in production or real operation, not planned or announced</li>
        <li>It changes a <b>specific business process</b> &mdash; claims, inspection, underwriting, triage</li>
        <li>Something was <b>measured</b>: a percentage, an amount of time, a cost, a rate</li>
        <li>The source is a <b>substantive article</b> about that deployment, not a page about a product</li>
      </ul>
      <p class="fnote">A vendor's own writing can qualify, but only when it names the actual customer and reports real numbers. Otherwise it is a brochure with a case study's grammar.</p>
    </div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Why the bar sits here</h2><span class="label">what the filtering buys</span></div>
    <p class="body" style="max-width:80ch;font-size:16.5px;padding-top:18px;border-top:1px solid var(--hair)">The atlas is meant to answer a question that is otherwise very hard to answer honestly: where is AI actually being used, and to do what. Announcements, headcount figures and market reports are abundant and answer none of that. Filtering them out is most of the work, and it is the reason the pipeline discards more than eight of every ten things it finds. The bar is not conservative by accident &mdash; it is what makes the remaining tenth worth anything.</p>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>The five families of rejection</h2><span class="label">select one</span></div>
    <p class="body" style="padding-bottom:18px">Every rejected candidate is recorded with a reason, and those reasons cluster into five recognisable families. Knowing which family dominates on a given day is what tells you whether the problem is the queries, the sources, or the bar.</p>
    <div class="rex">
      <div class="rex-nav" id="rexNav"></div>
      <div class="rex-p" id="rexPanel"></div>
    </div>
  </div>
</section>

<!-- ==================== THE RULES ==================== -->
<section class="sec" id="sec-rules">
  <div class="hero side">
    <div class="hero-l">
      <div class="sectitle"><span class="grp">The harness around them:</span><b>Rules</b></div>
      <h1>A standard a model can follow is a standard<span class="fade"> written as thresholds</span></h1>
      <p class="lede">"Good quality" is not executable. Every judgment in this pipeline had to be turned into something with a number, a list, or a yes-or-no test attached &mdash; otherwise each day's run would apply a slightly different bar, and the dataset would drift without anyone being able to say when.</p>
    </div>
    <div class="funnel">
      <span class="label">The hard numbers</span>
      <div class="figs" style="border-top:0;padding-top:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 20px">
        <div class="fig"><span class="v" style="color:var(--amber)">10</span><span class="l">gates every candidate passes</span></div>
        <div class="fig"><span class="v" style="color:var(--amber)">6</span><span class="l">phrase families that reject on sight</span></div>
        <div class="fig"><span class="v" style="color:var(--violet)">17</span><span class="l">advertorial rules, run by hand</span></div>
        <div class="fig"><span class="v" style="color:var(--green)">15</span><span class="l">fields the rules cover</span></div>
      </div>
    </div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Why it is written this way</h2><span class="label">the point of the whole exercise</span></div>
    <p class="body" style="font-size:16.5px;max-width:82ch">A skill is only as reliable as the loosest thing in it. Tell a model to "reject low-quality content" and it will agree, then apply a different standard on Tuesday than it did on Monday, and there is no artifact you can point at to prove it drifted. Tell it that content is at least five hundred characters, that a summary is at least two hundred, that an industry must come from a fixed list of seventy-six values, that a coordinate is never zero &mdash; and every run applies the same bar, every rejection carries a reason code, and a disagreement becomes a question about a rule rather than about taste.</p>
    <p class="body" style="max-width:82ch;margin-top:14px">That is the trade this project made everywhere. The rules below are not documentation written after the fact; they <em>are</em> the pipeline. Each one exists because something got through without it.</p>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>What a record must be</h2><span class="label">ten gates &middot; nothing is scored</span></div>
    <p class="body" style="max-width:82ch;margin-bottom:20px">A candidate is not scored, it is admitted or rejected. Six of the ten gates are nothing more than the record's own fields being filled to their stated constraint; the other four decide whether the thing is a deployment at all. Every rejection carries a machine-readable reason, which is what makes a bad day diagnosable rather than merely disappointing.</p>
    <div class="rec">
      <div class="rh"><span>Field</span><span>Constraint</span><span>The rule</span><span>On failure</span></div>
      <div class="rr"><code class="fn">title</code><span class="ct">English</span><span class="rw">A brief name for the AI application &mdash; not the article headline verbatim.</span><span class="rc"><em class="nil">&mdash;</em></span></div>
      <div class="rr"><code class="fn">summary</code><span class="ct hard">200+ chars</span><span class="rw">Describes the deployment, not the organisation behind it.</span><span class="rc"><em class="nil">&mdash;</em></span></div>
      <div class="rr"><code class="fn">content</code><span class="ct hard">500+ chars</span><span class="rw">A real use-case description, never marketing copy. A non-English source is translated, never discarded.</span><span class="rc"><code>content_length</code></span></div>
      <div class="rr"><code class="fn">URL</code><span class="ct hard">specific article</span><span class="rw">A post, release or case study. Never a homepage, product or pricing page, never LinkedIn, never an academic repository.</span><span class="rc"><code>url_type</code></span></div>
      <div class="rr"><code class="fn">company_id</code><span class="ct no">must resolve</span><span class="rw">An anonymous deployment drops the whole case. Never null, never a generated name, never a consortium standing in for a business.</span><span class="rc"><code>company_unverified</code></span></div>
      <div class="rr"><code class="fn">industry</code><span class="ct hard">1 of 76</span><span class="rw">Chosen by the deploying organisation's primary business, not by what the AI does.</span><span class="rc"><code>industry_invalid</code></span></div>
      <div class="rr"><code class="fn">published_at</code><span class="ct">ISO-8601</span><span class="rw">The article's own publication date, read from the page rather than assumed.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">country</code><span class="ct">standardised</span><span class="rw">The canonical country name, not whatever spelling the article used.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">city</code><span class="ct hard">mandatory</span><span class="rw">Where the deployment actually is.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">continent</code><span class="ct">derived</span><span class="rw">Checked for consistency with the country, not assumed.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">latitude / longitude</code><span class="ct no">never 0 &middot; 999 &middot; null</span><span class="rw">Looked up from the real city. On a globe a placeholder is not a missing value, it is a visible point in the wrong place.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">type</code><span class="ct">enum</span><span class="rw">Deployment &mdash; in real operation, with metrics. Experiment &mdash; a pilot. Research &mdash; academic or R&amp;D.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">source_name</code><span class="ct">enum</span><span class="rw">Media, company website, research report or analyst firm.</span><span class="rc"><em>re-extracted</em></span></div>
      <div class="rr"><code class="fn">confidence_score</code><span class="ct hard">fixed 0.8</span><span class="rw">A constant, so nobody invents a precision the pipeline does not have.</span><span class="rc"><em class="nil">&mdash;</em></span></div>
      <div class="rr"><code class="fn">status</code><span class="ct hard">pending</span><span class="rw">Always pending on insert. Only a human reviewer moves it from there.</span><span class="rc"><em class="nil">&mdash;</em></span></div>
    </div>
    <p class="recfoot">One gate rewrites rather than rejects: any output field still carrying CJK after the translation pass is translated again &mdash; never the source text itself, which is kept as found.</p>

    <div class="recsplit"><span>Four gates no field can carry</span></div>
    <p class="body" style="max-width:82ch;margin-bottom:16px">These are judgments about the article, not about a column. They are written out literally because a rule a model has to infer is a rule it will apply inconsistently.</p>
    <div class="rec g3">
      <div class="rh"><span>Gate</span><span>What it catches</span><span>On failure</span></div>
      <div class="rr"><b class="gn">Contamination</b><span class="rw">Text that is mostly navigation, CTA, footer or cookie banner. Text that opens with a document tag fails immediately. PDFs are allowed; raw extraction artifacts are not.</span><span class="rc"><code>contamination</code><code>html_page_contamination</code></span></div>
      <div class="rr"><b class="gn">Generic description</b><span class="rw">Boilerplate with no named deployment &mdash; &ldquo;leading provider of AI-powered solutions&rdquo;.</span><span class="rc"><code>generic_description</code></span></div>
      <div class="rr"><b class="gn">Deployment vs news</b><span class="rw">Future tense, partnership announcements, launches, government initiatives &mdash; anything with no measured outcome yet.</span><span class="rc"><code>news_announcement</code></span></div>
      <div class="rr"><b class="gn">Scale announcement</b><span class="rw">All four at once: the claim is a headcount, no business process is named, the tool is a general-purpose assistant, no operational metric is given.</span><span class="rc"><code>scale_announcement_only</code></span></div>
    </div>
    <p class="recfoot">Two more reasons are emitted before any of this runs &mdash; <code>negative_list</code> and <code>negative_list_domain</code>, for a URL or a whole domain that has been permanently retired. Those candidates are never fetched at all.</p>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Words that reject on sight</h2><span class="label">checked in title and summary</span></div>
    <p class="body" style="max-width:82ch;margin-bottom:8px">Six families of phrasing are treated as disqualifying before anything subtler is considered. They are listed literally rather than described, so there is nothing left to interpret.</p>
    <div class="sigs">
      <div class="sig"><span class="sl">News announcement</span><div class="words"><span>announces</span><span>brings</span><span>partners&nbsp;with</span><span>collaboration&nbsp;with</span><span>launches&nbsp;new</span><span>joins&nbsp;forces</span></div></div>
      <div class="sig"><span class="sl">Roundup / statistics</span><div class="words"><span>benchmark</span><span>statistics</span><span>top&nbsp;10</span><span>top&nbsp;5</span><span>ranking</span><span>comparison</span><span>vs.</span><span>versus</span><span>trends&nbsp;2026</span></div></div>
      <div class="sig"><span class="sl">Vendor guide</span><div class="words"><span>guide</span><span>tutorial</span><span>how&nbsp;to&nbsp;choose</span><span>what&nbsp;is</span><span>introduction&nbsp;to</span><span>getting&nbsp;started</span><span>complete&nbsp;guide</span></div></div>
      <div class="sig"><span class="sl">Research report</span><div class="words"><span>white&nbsp;paper</span><span>benchmark&nbsp;report</span><span>market&nbsp;report</span><span>industry&nbsp;report</span><span>survey</span></div></div>
      <div class="sig"><span class="sl">Self-promotion</span><div class="words"><span>our&nbsp;platform</span><span>our&nbsp;solution</span><span>how&nbsp;[vendor]&nbsp;uses&nbsp;its&nbsp;own&nbsp;product</span></div></div>
      <div class="sig"><span class="sl">Generic study</span><div class="words"><span>study&nbsp;shows</span><span>research&nbsp;finds</span><span>survey&nbsp;finds</span><span>report&nbsp;reveals</span></div></div>
    </div>
    <p class="body" style="max-width:82ch;margin-top:14px">The one deliberate exception: a vendor's own writing survives if it names the actual customer <em>and</em> reports quantitative deployment metrics. That exception is itself written down, so it is applied the same way every time instead of being re-argued each day.</p>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Three states, enforced by the database</h2><span class="label">not a convention &mdash; a constraint</span></div>
    <p class="body" style="max-width:82ch;margin-bottom:10px">The record state is not a string anyone can invent. It is a database-level constraint permitting exactly three values, so an invalid state cannot be written even by mistake.</p>
    <div class="states">
      <div class="state" style="--sc:#43cc93"><span class="sn">published</span><span class="sm">Reviewed and approved</span><span class="sd">Rendered normally, everywhere in the product.</span></div>
      <div class="state" style="--sc:#e8a33d"><span class="sn">pending</span><span class="sm">Written by the pipeline, not yet reviewed</span><span class="sd">Rendered, but labelled <em style="font-style:normal;color:#e6edf7">To be validated</em> &mdash; visible is more useful than hidden, as long as nobody can mistake it for verified.</span></div>
      <div class="state" style="--sc:#f2607a"><span class="sn">archived</span><span class="sm">Retired, kept for history and audit</span><span class="sd">Excluded from every frontend surface, and its URL is permanently blocked from re-entering.</span></div>
    </div>
    <p class="body" style="max-width:82ch;margin-top:14px">Extending that set is explicitly a two-part change: the constraint and the display logic move together, or the product renders a state it does not understand.</p>
  </div>


  <div class="band rowh">
    <div class="band-h"><h2>Telling a deployment from an advertorial</h2><span class="label">17 rules &middot; a periodic manual audit</span></div>
    <p class="body" style="font-size:16.5px;max-width:82ch">The ten gates run every day and catch what is structurally wrong. This is the harder judgment, and it is deliberately <b>not</b> automated on a schedule: a separate rule set, applied by hand in batches as a periodic spot-check of records already stored, for deciding whether an article that passed everything else is reporting a deployment or selling one.</p>
    <p class="body" style="max-width:82ch;margin-top:14px">Its whole standard fits in one line &mdash; <em>technical detail is acceptable, pure hype is not</em> &mdash; where technical detail means a tool, a platform, a model, an architecture or an implementation step. "Improved efficiency" and "reduced cost" are business outcomes, not technical detail.</p>
    <p class="body" style="max-width:82ch;margin:18px 0 10px">That one line turned out to be too loose on its own, so it was split into three independent dimensions that must <b>all</b> be satisfied. Each has a qualifying signal and a vague one, written out so the same call is made every time.</p>
    <div class="dims">
      <div class="dim"><span class="dn">AI technology</span><span class="dq">Is a specific model, algorithm or tool named?</span><div class="ex ok"><span class="h">Qualifies</span>“a bespoke CNN model” &middot; “Azure OpenAI” &middot; “a time-series LLM”</div><div class="ex no"><span class="h">Too vague</span>“uses AI” &middot; “AI-driven” &middot; “advanced algorithms”</div></div>
      <div class="dim"><span class="dn">Deployment scenario</span><span class="dq">Which line, which process, which task?</span><div class="ex ok"><span class="h">Qualifies</span>“overhead conveyor line, clip and clamp detection” &middot; “claims processing at a named hospital”</div><div class="ex no"><span class="h">Too vague</span>“improving efficiency” &middot; “optimising operations” &middot; “transforming X”</div></div>
      <div class="dim"><span class="dn">Anchored numbers</span><span class="dq">Is the figure tied to that scenario?</span><div class="ex ok"><span class="h">Qualifies</span>“30 ms processing” &middot; “86% accuracy” &middot; “20 minutes down to 10 seconds”</div><div class="ex no"><span class="h">Too vague</span>“significantly improved” &middot; “high accuracy” &middot; a bare “N% better”</div></div>
    </div>
    <p class="body" style="max-width:82ch;margin-top:16px"><b>The counter-intuitive signal:</b> few numbers, all anchored, are stronger than many numbers that float. Five figures tied to a specific CNN on a specific conveyor line qualify. Fifteen figures attached to nothing more specific than a product name and three broad departments are weaker &mdash; accepted only when the deployer is large enough that the scale itself is evidence.</p>
    <p class="body" style="max-width:82ch;margin-top:12px">The template it exists to catch reads exactly like a case study and satisfies none of the three: <em>"X deployed AI to revolutionise Y. The system uses advanced computer vision to detect defects with high accuracy, improving quality and reducing costs."</em></p>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>The seventeen rules</h2><span class="label">one pre-check &middot; thirteen verdicts &middot; one disposition &middot; two audits</span></div>
    <div class="triage">

      <div class="tbar" style="--tc:#22d3ee">
        <div class="tlab"><i>Runs first</i><code>R11</code></div>
        <div class="tb">
          <b>URL health check</b>
          <p>Mandatory before R1&ndash;R10 are evaluated at all. There is no point judging an article that will not load, and every later rule assumes the page in front of it is the page on record.</p>
        </div>
      </div>

      <div class="tflow"><span class="line"></span><span>then one verdict, from thirteen</span></div>

      <div class="tgrid">
      <div class="tcol" style="--tc:#f2607a">
        <div class="th"><b>Reject</b><em>7</em></div>
        <div class="tr"><code>R1</code><span><b>Blocklisted source</b> &mdash; subscription walls, unknown aggregators with no editorial team, design portfolios, tool-marketing sites running “case studies” beside tutorials</span></div>
        <div class="tr"><code>R2</code><span><b>Paid native advertising</b> &mdash; a sponsored or brand-studio label, or the vendor speaking inside the article. Numbers do not redeem it</span></div>
        <div class="tr"><code>R3</code><span><b>Pure hype</b> &mdash; business outcomes only &mdash; no tool, platform, method or stack named anywhere</span></div>
        <div class="tr"><code>R8</code><span><b>Synthetic composite</b> &mdash; a customer assembled from several, or invented outright; judged by hand in the audit</span></div>
        <div class="tr"><code>R10</code><span><b>Partnership or MOU</b> &mdash; no deployment in the past tense anywhere in the piece</span></div>
        <div class="tr"><code>R12</code><span><b>Survey or market analysis</b> &mdash; research findings wearing a case study's headline</span></div>
        <div class="tr"><code>R13</code><span><b>Not about AI</b> &mdash; the story turns out to be about something else entirely</span></div>
      </div>
      <div class="tcol" style="--tc:#43cc93">
        <div class="th"><b>Accept</b><em>4</em></div>
        <div class="tr"><code>R4</code><span><b>Vendor blog with substance</b> &mdash; real technical detail, and the customer is named</span></div>
        <div class="tr"><code>R5</code><span><b>Built and run in-house</b> &mdash; a large organisation describing its own system</span></div>
        <div class="tr"><code>R6</code><span><b>Independent media</b> &mdash; reporting with technical detail</span></div>
        <div class="tr"><code>R7</code><span><b>Public sector or academic</b> &mdash; government, university or non-profit deployments</span></div>
      </div>
      <div class="tcol" style="--tc:#e8a33d">
        <div class="th"><b>Downgrade</b><em>2</em></div>
        <div class="tr"><code>R9</code><span><b>Anonymous customer</b> &mdash; the vendor is the only source &mdash; kept, confidence reduced</span></div>
        <div class="tr"><code>R14</code><span><b>Vendor self-publishing</b> &mdash; high risk by default, with written exceptions rather than case-by-case argument</span></div>
      </div>
      </div>

      <div class="tflow"><span class="line"></span><span>and a rejection has somewhere to go</span></div>

      <div class="tbar" style="--tc:#a78bfa">
        <div class="tlab"><i>Disposition</i><code>R15</code></div>
        <div class="tb">
          <b>Archived, never deleted</b>
          <p>An advertorial, a dead source or a fabricated record is retired rather than removed. The history stays auditable, and the URL is permanently blocked from re-entering &mdash; which is what stops the same bad article arriving again next week.</p>
        </div>
      </div>

      <div class="tflow" style="padding-top:26px"><span>a separate loop &middot; run against stored cases, not candidates</span></div>

      <div class="taudits">
        <div class="taudit">
          <div class="h"><code>R16</code><b>Content drift</b></div>
          <p>What is stored no longer matches what the source says &mdash; the article was edited, softened or replaced after the case was recorded.</p>
        </div>
        <div class="taudit">
          <div class="h"><code>R17</code><b>URL now points elsewhere</b></div>
          <p>The link still resolves, but to a different article than the one the case was built from. Alive is not the same as correct.</p>
        </div>
      </div>

    </div>
  </div>

</section>


<!-- ==================== RESILIENCE ==================== -->
<section class="sec" id="sec-res">
  <div class="hero side">
    <div class="hero-l">
      <div class="sectitle"><span class="grp">The harness around them:</span><b>Resilience</b></div>
      <h1>Designed around the assumption that things go wrong<span class="fade"> quietly</span></h1>
      <p class="lede">The pipeline's failure handling was not designed in advance. Almost every rule in it is the scar tissue of a specific day that went wrong in a way nobody noticed at the time &mdash; and every one of those days produced plausible output. Nothing crashed, nothing threw, and the run reported success. That is the specific hazard of a pipeline built on a language model and a set of external services: <em>the default failure mode is not an error, it is a confident, well-formed, wrong result.</em> Which is why the recurring theme is not "retry harder" but "make the failure visible", and why the design invests far more in detecting silent failure &mdash; empty-as-error, mechanical re-checks, per-tool statistics, recorded reasons &mdash; than in recovering from loud failure, which was never the real risk.</p>
    </div>
    <div class="funnel">
      <span class="label">Three standing rules</span>
      <div class="dl">
        <div>
          <span class="what">Fail forward, never halt</span>
          <span class="why">A stage that cannot do its job produces an empty result and the run continues. Halting would mean no report.</span>
        </div>
        <div>
          <span class="what">Treat emptiness as suspicious</span>
          <span class="why">A zero result from a tool is handled as a failure, not as an answer.</span>
        </div>
        <div>
          <span class="what">Record why, not just what</span>
          <span class="why">Counts tell you a day was bad. Reasons tell you whether to change the queries, the sources, or nothing at all.</span>
        </div>
      </div>
    </div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Incidents that became rules</h2><span class="label">each one failed quietly first</span></div>
    <div class="tw"><table>
      <thead><tr><th style="width:31%">What happened</th><th style="width:33%">Why it went unnoticed</th><th>The rule it produced</th></tr></thead>
      <tbody>
        <tr><td>The same fixed queries ran for days and eventually returned nothing but articles already on record</td><td>The run looked healthy &mdash; searches succeeded, candidates arrived, they were simply all duplicates</td><td>Queries rotate daily out of a much larger pool, so a question is not repeated for weeks</td></tr>
        <tr><td>A search tool hit its weekly quota and returned an empty success</td><td>Nothing errored. The day was recorded as a day with no AI deployments in the world</td><td>Empty results trigger a fallback to a different tool, and the substitution is recorded</td></tr>
        <tr><td>The strongest search tool went weeks without being called</td><td>A global fallback order meant the first tool almost always succeeded first</td><td>Each query layer has its own primary tool, so all of them stay in use and stay measurable</td></tr>
        <tr><td>Untranslated records reached the dataset</td><td>The validator was confident it had translated them</td><td>A mechanical check scans the output for untranslated text before anything is written</td></tr>
        <tr><td>Seventeen vendor pages were recorded as deployments in one day</td><td>Each one individually read like a case study</td><td>A second mechanical check screens for vendor domains, announcement phrasing and roundups</td></tr>
        <tr><td>The review backlog was reported as far smaller than it was</td><td>The count silently stopped at the first page of results</td><td>Backlog figures are counted at the source rather than tallied from a fetched list</td></tr>
      </tbody>
    </table></div>
  </div>

</section>

<!-- ==================== KNOWLEDGE ==================== -->
<section class="sec" id="sec-src">
  <div class="hero side">
    <div class="hero-l">
      <div class="sectitle"><span class="grp">The harness around them:</span><b>Knowledge</b></div>
      <h1>Who owns which<span class="fade"> decision</span></h1>
      <p class="lede">The pipeline's behaviour is not spread across code &mdash; it is written down in a set of documents, each of which is authoritative for one kind of decision. Select any of them to see what it decides and who reads it.</p>
    </div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Stage definitions</h2><span class="label">one per stage</span></div>
    <div class="srcs" id="srcStages"></div>
  </div>

  <div class="band rowh">
    <div class="band-h"><h2>Shared standards</h2><span class="label">read by more than one stage</span></div>
    <div class="srcs" id="srcShared"></div>
  </div>

  
</section>

<!-- ==================== RESULTS ==================== -->
<section class="sec" id="sec-out">
  <div class="hero side">
    <div class="hero-l">
      <div class="sectitle"><b>Results</b></div>
      <h1>Six months of use cases, and two<span class="fade"> filters</span></h1>
      <p class="lede">April through early September, read from the database itself and from the pipeline's own run log. Two things are worth separating: what the pipeline discards before writing a case down, and what review discards afterwards. Both are large, and only the first was designed.</p>
    </div>
    <div class="funnel">
      <span class="label">Use cases in the database</span>
      <div class="figs" style="gap:26px 34px">
        <div class="fig"><span class="v" style="color:var(--cyan)">1,560</span><span class="l">recorded since April</span></div>
        <div class="fig"><span class="v" style="color:var(--violet)">1,718</span><span class="l">recorded all-time</span></div>
        <div class="fig"><span class="v" style="color:var(--green)">700</span><span class="l">published after human-in-the-loop review</span></div>
        <div class="fig"><span class="v" style="color:var(--amber)">0</span><span class="l">awaiting review</span></div>
      </div>
      <p class="fnote">Counted at the source on 15 September 2026. Months are by record creation date, so a case found in June counts to June regardless of when its article was published.</p>
    </div>
  </div>

  <div class="band">
    <div class="band-h"><h2>Use cases recorded, April to September</h2><span class="label">from the database</span></div>
    <div class="chart-wrap"><svg class="chart" id="monthly" viewBox="0 0 900 320" role="img" aria-label="Use cases recorded each month from April to September 2026"></svg></div>
    <div class="legend">
      <span><i style="background:#43cc93"></i>Published after review</span>
      <span><i style="background:#f2607a"></i>Archived after review</span>
    </div>
  </div>



</section>

  <div class="closing">
    <p>Everything that survives all of this ends up on one map.</p>
    <a href="/">Explore AI Atlas <span>&rarr;</span></a>
  </div>

</div>



<button class="totop" id="toTop" aria-label="Back to top">↑</button>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
  <div class="drawer-h">
    <div style="min-width:0">
      <p id="drawerRole">&mdash;</p>
      <h2 id="drawerTitle">&mdash;</h2>
    </div>
    <button class="drawer-x" id="drawerX" aria-label="Close">&times;</button>
  </div>
  <div class="drawer-b scroll" id="drawerBody"></div>
</aside>`

const BEHAVIOUR = `
/* ---------- one page: nav follows the scroll ---------- */
const chrome=ROOT.querySelector('.topbar');
const atlas=document.getElementById('atlas-chrome');
const setChrome=()=>{
  const a=atlas?atlas.offsetHeight:0;
  document.documentElement.style.setProperty('--atlas-chrome',a+'px');
  document.documentElement.style.setProperty('--chrome',(a+chrome.offsetHeight)+'px');
};
setChrome(); window.addEventListener('resize',setChrome);
const navs=[...ROOT.querySelectorAll('[data-go]')];
/* every stage stepper repeats s1-s4, so dedupe and order by document position —
   otherwise the last entry always wins and the spy sticks on the final stage */
const SECS=[...new Set(navs.map(n=>n.dataset.go))]
  .filter(id=>__el('sec-'+id))
  .sort((a,b)=>__el('sec-'+a).offsetTop-__el('sec-'+b).offsetTop);
function go(id){
  const el=__el('sec-'+id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}
navs.forEach(n=>n.addEventListener('click',()=>go(n.dataset.go)));

const toTop=__el('toTop');
toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
let current=null;
const rowSteps=[...ROOT.querySelectorAll('.steps .navstep')];
const rowTicks=[...ROOT.querySelectorAll('.steps .tick')];
function mark(id){
  if(id===current)return;
  current=id;
  navs.forEach(n=>{
    if(n.dataset.go===id)n.setAttribute('aria-current','true');
    else n.removeAttribute('aria-current');
  });
  /* the connectors fill in behind the reader, so position and progress are
     one device rather than two cyan lines competing on the same baseline */
  const at=SECS.indexOf(id);
  rowTicks.forEach((t,i)=>t.classList.toggle('done',i<at));
  rowSteps.forEach(b=>{
    const j=SECS.indexOf(b.dataset.go);
    b.classList.toggle('done',j>-1&&j<at);
  });
  /* the nav row scrolls sideways, and on a phone only about three of the eight
     entries fit \u2014 without this the reader never sees where they are */
  const row=ROOT.querySelector('.steps');
  const cur=rowSteps.find(b=>b.dataset.go===id);
  if(row&&cur&&row.scrollWidth>row.clientWidth+4){
    row.scrollTo({left:Math.max(0,cur.offsetLeft-(row.clientWidth-cur.offsetWidth)/2),behavior:'smooth'});
  }
}
function onScroll(){
  const doc=document.documentElement;
  const y=window.scrollY;
  toTop.classList.toggle('on',y>900);
  /* the section that owns the top third of the viewport is the one you are reading */
  const line=y+doc.clientHeight*0.32;
  /* the overview has no nav entry of its own, so nothing is marked until the
     reader actually reaches the first section that does */
  let found=null;
  for(const id of SECS){
    const el=__el('sec-'+id);
    if(el&&el.offsetTop<=line)found=id;
  }
  mark(found);
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll);
onScroll();
/* ================= interactive pipeline canvas ================= */
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
  role:'Where the evidence lives', line:'News, case studies, vendor pages',
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
  role:'Reference', line:'Layers, rotation, retired queries',
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
  role:'Every day', line:'The standard, run over stored cases',
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
  eyebrow:'STAGE 3', title:'Persist', line:'Records each survivor once',
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
  role:'Retired by a reviewer', line:'Kept, hidden, and remembered',
  panel:{lead:'A case a human reviewer has read and judged not worth carrying. It is retired rather than deleted, and the decision is kept where the pipeline can use it.',
         secs:[['Why not deleted','The history stays auditable. A record that simply vanishes leaves no way to answer why something is no longer there, or whether it was ever there at all.'],
               ['It feeds the deduplication','Archived cases are part of what the recording stage treats as already seen. Without that, a source a reviewer rejected would be found again, judged again, and written again \u2014 and the reviewer would have to make the same decision every week.'],
               ['Where it is visible','Nowhere on the public site. It is excluded from every frontend surface, and its URL is blocked from re-entering.']]}},

 {id:'atlas', x:1090, y:689, w:206, h:86, kind:'sink', title:'The atlas', own:'pm',
  role:'The dataset behind the product', line:'Every recorded use case',
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

 {id:'weekly', x:530, y:860, w:206, h:86, kind:'job', title:'Weekly report', own:'pm',
  role:'Every Monday', line:'Is the system working?',
  panel:{lead:'The daily message answers what was found. This answers whether the system is working \u2014 and it publishes rather than notifies.',
         secs:[['Computes','Funnel conversion, which industries are accumulating, the status breakdown, tool usage against last week, query performance, outstanding quality issues, a system-health call, and next steps.'],
               ['Its start time is set by the job before it','It waits for Sunday\u2019s pipeline, which routinely crosses midnight. The gap between them is a deliberate buffer rather than a round number.'],
               ['Zero-data weeks are checked first','A week where the pipeline was offline gets a report that says so, rather than a normal-looking one full of zeros.']]}},

 {id:'backup', x:810, y:860, w:206, h:86, kind:'job', title:'Weekly backup', own:'pm',
  role:'Every Sunday', line:'Four tables, dated files',
  panel:{lead:'The plainest job in the system, and the only thing between an operator mistake and permanent loss.',
         secs:[['What it taught','A database was damaged days after the newest backup was taken, and the missing ingest was recovered instead from the pipeline\u2019s own intermediate handoff files \u2014 which nobody had thought of as a backup. They are now treated as part of the recovery surface.'],
               ['Open issue','It requests every row in one call with no pagination, and the database returns only the first page. Nothing errors \u2014 the files are valid and have been growing weekly, while quietly holding less than the whole.']]}},

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
 /* what has been discarded is kept out of what gets asked for next */
 {a:'rej', as:'l', b:'s1', bs:'b', flow:0, cls:'feedback', back:true, label:'excluded from later searches'},
 {a:'k1',  as:'b', b:'s1', bs:'t', flow:0, cls:'know'},
 /* the learnings record is the memory of the whole run, not of one stage */
 {a:'k4',  as:'b', b:'s1', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s2', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s3', bs:'t', flow:0, cls:'know'},
 {a:'k4',  as:'b', b:'s4', bs:'t', flow:0, cls:'know'},
 /* the standard reaches up into the pipeline through the gaps between stages */
 {a:'k2',  as:'r', b:'s2', bs:'l', flow:0, cls:'know'},
 {a:'k3',  as:'r', b:'s3', bs:'l', flow:0, cls:'know'},
 /* the quality check is nothing but those two standards, run over stored cases */
 {a:'k2',  as:'t', b:'qc', bs:'b', flow:0, cls:'know'},
 {a:'k3',  as:'l', b:'qc', bs:'r', flow:0, cls:'know'},
 {a:'atlas', as:'t', b:'qc',     bs:'b', flow:0, cls:'feedback', cy:[623,623]},
 {a:'atlas', as:'b', b:'audit',  bs:'t', flow:0, cls:'feedback'},
 {a:'atlas', as:'b', b:'weekly', bs:'t', flow:0, cls:'feedback'},
 {a:'atlas', as:'b', b:'backup', bs:'t', flow:0, cls:'feedback'},
 {a:'atlas', as:'b', b:'ccx',    bs:'t', flow:0, cls:'know', label:'context & knowledge'}
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
  gLanes.appendChild(mk('text',{x:L.x+18,y:L.y+23,fill:o.c,'fill-opacity':.78,'pointer-events':'none',
    'font-family':'Geist Mono, monospace','font-size':11,'letter-spacing':'1.5','font-weight':500},L.label));
  gLanes.appendChild(mk('text',{x:L.x+18+L.label.length*8.35+18,y:L.y+23,fill:'#5f748f','pointer-events':'none',
    'font-family':'Geist, sans-serif','font-size':11.5},L.sub));
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
    const mx=(x1+x2)/2, my=(y1+y2)/2 - (e.as==='r'?11:0);
    const t=mk('text',{x:mx,y:my,fill:'#7d93b1','font-family':'Geist Mono, monospace','font-size':11,'text-anchor':'middle','letter-spacing':'.06em'},e.label);
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
    g.appendChild(mk('text',{x:n.x+18,y:n.y+28,fill:n.accent,'font-family':'Geist Mono, monospace','font-size':11,'letter-spacing':'1.7'},n.eyebrow));
    g.appendChild(mk('text',{x:n.x+18,y:n.y+58,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':21,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+18,y:n.y+81,fill:'#8ba0bd','font-family':'Geist, sans-serif','font-size':13},n.line));
  } else if(n.kind==='know'){
    g.appendChild(mk('text',{x:n.x+16,y:n.y+26,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':15,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+45,fill:'#7d93b1','font-family':'Geist, sans-serif','font-size':12},n.line));
  } else {
    g.appendChild(mk('text',{x:n.x+16,y:n.y+30,fill:'#e6edf7','font-family':'Geist, sans-serif','font-size':16.5,'font-weight':600},n.title));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+50,fill:'#8ba0bd','font-family':'Geist, sans-serif','font-size':12.5},n.role||''));
    g.appendChild(mk('text',{x:n.x+16,y:n.y+67,fill:'#5f748f','font-family':'Geist, sans-serif','font-size':12},n.line||''));
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


/* ---------- rejection families ---------- */
const FAMILIES=[
  {k:'Not an article',n:'Wrong kind of page',
   d:'The link never had a chance of being a case study. Category and search pages, pricing and product pages, paper repositories, social posts, and pages whose fetched text turns out to be navigation, cookie banners or raw markup rather than writing.',
   pts:['Caught as early as possible, since reading these costs time and yields nothing',
        'A page that returns mostly interface furniture is treated the same as an empty page',
        'Academic repositories are excluded outright: a paper is research, not a deployment']},
  {k:'Not a deployment',n:'Announcement, not operation',
   d:'The single largest family. The article is about something a company said, plans, or launched, rather than something it runs. It shares nearly all of its vocabulary with a genuine case study, which is why this judgment cannot be made from a search snippet.',
   pts:['Future tense, partnership language, and "will enable" are the tells',
        'A press release with no measured outcome fails even when the deployment is real',
        'Government strategies and initiatives are excluded as a category']},
  {k:'Not specific',n:'No process, no number',
   d:'Something is happening, but the article never says what changed or by how much. This family includes the headcount announcements &mdash; large, well-sourced, and empty of operational content &mdash; along with generic capability descriptions and market commentary.',
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
const rexNav=__el('rexNav'), rexPanel=__el('rexPanel');
function renderFamily(i){
  const f=FAMILIES[i];
  [...rexNav.children].forEach((c,j)=>c.setAttribute('aria-selected',String(j===i)));
  rexPanel.innerHTML='<h3 style="font-size:19.5px;margin:0;letter-spacing:-.018em">'+f.n+'</h3>'+
    '<p style="font-size:15.4px;line-height:1.66;color:var(--muted)">'+f.d+'</p>'+
    '<ul class="list tight">'+f.pts.map(p=>'<li>'+p+'</li>').join('')+'</ul>';
}
FAMILIES.forEach((f,i)=>{
  const b=document.createElement('button');
  b.className='rex-b'; b.setAttribute('aria-selected',String(i===0));
  b.innerHTML='<span>'+f.k+'</span><em>'+f.n+'</em>';
  b.addEventListener('click',()=>renderFamily(i));
  rexNav.appendChild(b);
});
renderFamily(0);

/* ---------- knowledge sources ---------- */
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
     ['What it enables','Every claim on this page about survival rates, tool performance and rejection patterns is read from this record.']]}
];
function srcCard(s){
  const el=document.createElement('button');
  el.className='src';
  el.innerHTML='<span class="in"><span class="sr">'+s.r+'</span><span class="st">'+s.t+'</span><span class="sd">'+s.d+'</span></span><span class="arrow">&rarr;</span>';
  el.addEventListener('click',()=>openDrawer(s));
  return el;
}
SOURCES.filter(s=>s.g==='stage').forEach(s=>__el('srcStages').appendChild(srcCard(s)));
SOURCES.filter(s=>s.g==='shared').forEach(s=>__el('srcShared').appendChild(srcCard(s)));

const drawer=__el('drawer'), scrim=__el('scrim');
function openDrawer(s){
  __el('drawerTitle').textContent=s.t;
  __el('drawerRole').textContent=s.r;
  __el('drawerBody').innerHTML=
    '<p style="margin:0;color:var(--muted);font-size:15.4px;line-height:1.66">'+s.d+'</p>'+
    s.b.map(function(p){return '<div class="card" style="padding:15px 16px"><h3>'+p[0]+'</h3><div style="font-size:14.8px;color:var(--text);line-height:1.64">'+p[1]+'</div></div>';}).join('');
  drawer.classList.add('on'); scrim.classList.add('on');
  __el('drawerX').focus();
}
function closeDrawer(){drawer.classList.remove('on');scrim.classList.remove('on');}
__el('drawerX').addEventListener('click',closeDrawer);
scrim.addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

/* ---------- results chart ---------- */
const RUNS=[
 {d:'n1',c:41,v:11,i:6},{d:'n2',c:41,v:36,i:17},{d:'n3',c:51,v:9,i:6},{d:'n4',c:70,v:28,i:25},
 {d:'n5',c:59,v:0,i:0},{d:'n6',c:89,v:6,i:6},{d:'n7',c:89,v:4,i:1},{d:'n8',c:64,v:15,i:13},
 {d:'n9',c:65,v:9,i:8},{d:'n10',c:63,v:6,i:4},{d:'n11',c:60,v:3,i:3},{d:'n12',c:60,v:40,i:36},
 {d:'n13',c:58,v:3,i:2},{d:'n14',c:49,v:4,i:4}
];
(function(){
  const svg=__el('chart'); if(!svg)return;
  const W=900,H=300,L=46,R=16,T=18,B=48;
  const iw=W-L-R, ih=H-T-B, max=90, ticks=[0,30,60,90];
  const NS='http://www.w3.org/2000/svg';
  const add=(n,a,txt)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;svg.appendChild(e);return e;};
  ticks.forEach(t=>{
    const y=T+ih-(t/max)*ih;
    add('line',{x1:L,x2:L+iw,y1:y,y2:y,stroke:'#152540','stroke-width':1});
    add('text',{x:L-10,y:y+4,fill:'#5f748f','font-size':12,'font-family':'Geist Mono, monospace','text-anchor':'end'},t);
  });
  const band=iw/RUNS.length, bw=Math.min(10,band/4.2), gap=2.6;
  RUNS.forEach((r,i)=>{
    const cx=L+band*i+band/2;
    [[r.c,'#a78bfa'],[r.v,'#e8a33d'],[r.i,'#43cc93']].forEach((pair,j)=>{
      const h=(pair[0]/max)*ih;
      const x=cx-(bw*1.5+gap)+j*(bw+gap);
      add('rect',{x:x,y:T+ih-h,width:bw,height:Math.max(h,1),rx:2,fill:pair[1],opacity:.92});
    });
    add('text',{x:cx,y:H-B+19,fill:'#5f748f','font-size':9.5,'font-family':'Geist Mono, monospace','text-anchor':'middle'},'day '+(i+1));
  });
  add('line',{x1:L,x2:L+iw,y1:T+ih,y2:T+ih,stroke:'#1e3050','stroke-width':1});
})();

/* ---------- monthly ingest, April to September, split by what review decided ---------- */
const MONTHS=[
 {m:'April',    pub:227, arc:152},
 {m:'May',      pub:89,  arc:2},
 {m:'June',     pub:188, arc:283},
 {m:'July',     pub:39,  arc:133},
 {m:'August',   pub:49,  arc:238},
 {m:'September',pub:15,  arc:145}
];
(function(){
  const svg=__el('monthly'); if(!svg)return;
  const W=900,H=320,L=52,R=18,T=20,B=54;
  const iw=W-L-R, ih=H-T-B, max=500, ticks=[0,125,250,375,500];
  const NS='http://www.w3.org/2000/svg';
  const add=(n,a,t)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;svg.appendChild(e);return e;};
  ticks.forEach(t=>{
    const y=T+ih-(t/max)*ih;
    add('line',{x1:L,x2:L+iw,y1:y,y2:y,stroke:'#152540','stroke-width':1});
    add('text',{x:L-11,y:y+4,fill:'#5f748f','font-size':12,'font-family':'Geist Mono, monospace','text-anchor':'end'},t);
  });
  const band=iw/MONTHS.length, bw=Math.min(64,band*0.46);
  MONTHS.forEach((r,i)=>{
    const cx=L+band*i+band/2, tot=r.pub+r.arc, base=T+ih;
    const hp=(r.pub/max)*ih, ha=(r.arc/max)*ih;
    /* published sits on the axis, archived stacks above it, so the green band is
       what survived review and the height is still the month's intake */
    add('rect',{x:cx-bw/2,y:base-hp,width:bw,height:Math.max(hp,1),fill:'#43cc93',opacity:.92});
    add('rect',{x:cx-bw/2,y:base-hp-ha,width:bw,height:Math.max(ha,1),fill:'#f2607a',opacity:.86});
    add('text',{x:cx,y:base-hp-ha-9,fill:'#c3d2e6','font-size':14,'font-family':'Geist Mono, monospace','font-weight':600,'text-anchor':'middle'},tot);
    add('text',{x:cx,y:H-B+21,fill:'#8ba0bd','font-size':13,'font-family':'Geist, sans-serif','text-anchor':'middle'},r.m);
  });
  add('line',{x1:L,x2:L+iw,y1:T+ih,y2:T+ih,stroke:'#1e3050','stroke-width':1});
  add('text',{x:L,y:14,fill:'#5f748f','font-size':11,'font-family':'Geist Mono, monospace','letter-spacing':'1.4'},'USE CASES CREATED PER MONTH, 2026');
})();`

export function MethodologyBody() {
  const rootRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const root = rootRef.current
    // Strict Mode runs effects twice in development; the behaviour appends SVG
    // nodes and list items, so a second pass would double everything it draws.
    if (!root || started.current) return
    started.current = true
    try {
      // eslint-disable-next-line no-new-func
      new Function("ROOT", "__el", BEHAVIOUR)(root, (id: string) =>
        root.querySelector<HTMLElement>(`#${id}`),
      )
    } catch (err) {
      console.error("methodology: behaviour failed to start", err)
    }
  }, [])

  return <div className="mth" ref={rootRef} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
