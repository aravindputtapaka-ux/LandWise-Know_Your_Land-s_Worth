// import { useMemo, useState } from "react";
// import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Compass, Search, Sparkles } from "lucide-react";
// import "./Docs.css";
// import ArchitectureFlow from "../components/ArchitectureFlow";

// type Section = { id: string; title: string; eyebrow: string; summary: string; blocks: { heading: string; body: string; points?: string[] }[] };

// const sections: Section[] = [
//   { id: "overview", title: "What is LandWise?", eyebrow: "INTRODUCTION", summary: "LandWise AI is a web application for researching property prices and understanding what a budget may afford.", blocks: [
//     { heading: "Purpose", body: "LandWise brings property research into one place. Users can search for a location, request an estimated property price, review available market evidence and save their results." },
//     { heading: "Who uses it?", body: "It is intended for prospective buyers, landowners and people comparing property options. Managers and clients can use these pages to understand the product without a live demonstration." },
//     { heading: "What does an estimate mean?", body: "An estimate is an indicative calculation based on usable public market evidence. It is not a government valuation, a confirmed transaction price or a guarantee of the amount a property will sell for." },
//   ]},
//   { id: "landing", title: "Landing page", eyebrow: "WEBSITE GUIDE", summary: "The landing page is the public introduction to LandWise AI.", blocks: [
//     { heading: "Introduction section", body: "The opening section explains the application and provides actions to create an account or sign in. A background video supports the visual presentation." },
//     { heading: "Feature descriptions", body: "The feature section introduces evidence-based price estimates, property affordability and the way the application handles missing data." },
//     { heading: "How it works", body: "The landing page outlines the basic process: find relevant property sources, extract usable price and area information, compare values on a common unit basis and display the result." },
//     { heading: "Navigation", body: "Visitors can read Docs without signing in. Price estimation, account history and the authenticated assistant are accessed through the signed-in application." },
//   ]},
//   { id: "account", title: "Accounts and email OTP", eyebrow: "USER ACCESS", summary: "Accounts protect personal search history and conversations.", blocks: [
//     { heading: "Sign up", body: "A new user enters the required account details and receives a one-time password (OTP) by email. The OTP is used to verify the address before account access is completed." },
//     { heading: "Log in", body: "Registered users sign in to access the estimator, affordability tool, history and chatbot." },
//     { heading: "Forgot password", body: "The password-recovery process sends an OTP to the registered email address before a new password can be set." },
//     { heading: "Security", body: "The documented backend uses password hashing, time-limited OTPs with attempt limits and JWT-based authentication. Private credentials are kept on the backend." },
//   ]},
//   { id: "journey", title: "Using the application", eyebrow: "USER WORKFLOW", summary: "The usual workflow is to sign in, select a location, run an analysis and review the result.", blocks: [
//     { heading: "Step 1 — Choose a task", body: "Open the estimator to check a property price or switch to affordability to begin with a budget." },
//     { heading: "Step 2 — Enter details", body: "Choose the property type and location. For estimation, provide an area and its unit; for affordability, provide a budget and relevant property options." },
//     { heading: "Step 3 — Review the result", body: "Read the estimated amount, comparable rates, ranges and other available information. Some sections appear only when the backend has sufficient data." },
//     { heading: "Step 4 — Save and revisit", body: "Signed-in searches can be revisited in History. The assistant can help explain supported results and concepts." },
//   ]},
//   { id: "property", title: "Property price estimation", eyebrow: "PRICE RESEARCH", summary: "The estimator calculates an indicative price using relevant property evidence for the selected area.", blocks: [
//     { heading: "Supported property types", body: "The documented workflows cover land or plots, residential properties and commercial properties. Residential options include flats, villas and independent houses; commercial choices include offices, shops, floors and warehouses." },
//     { heading: "Inputs", body: "The user selects a location, property type, area and area unit. Depending on the property, the form may ask for additional details such as property status or commercial purpose." },
//     { heading: "Source discovery", body: "Tavily Search finds candidate property pages and Tavily Extract retrieves selected page content. The backend looks for explicit price and area values relevant to the requested locality." },
//     { heading: "Evidence validation", body: "The system checks that extracted values represent usable property information rather than unrelated numbers. It converts valid observations to a common price-per-square-foot basis." },
//     { heading: "Estimated result", body: "Comparable rates are used to calculate an estimated rate and total price for the requested area. The result can also show a typical price range and supporting sources." },
//     { heading: "Insufficient evidence", body: "If there are too few reliable observations, the estimator may report that a price cannot be determined instead of creating an unsupported figure." },
//   ]},
//   { id: "map", title: "Selecting a location on the map", eyebrow: "LOCATION INPUT", summary: "The map helps users select an address without typing it manually.", blocks: [
//     { heading: "Open the map", body: "Use Select on Map in the property form to open the OpenStreetMap-based location picker." },
//     { heading: "Choose a place", body: "Search for a place, click the map, move the marker or use browser location permission when available." },
//     { heading: "Confirm the address", body: "The picker uses reverse geocoding to turn selected coordinates into a readable address and fills the location field." },
//     { heading: "How it affects estimation", body: "The selected address is passed into the existing estimation workflow. The map is a location-input tool; it does not calculate property prices itself." },
//   ]},
//   { id: "trends", title: "Historical trends and forecasts", eyebrow: "PRICE TRENDS", summary: "For land-price searches with enough usable historical data, LandWise can display past observations and projected trends.", blocks: [
//     { heading: "Historical prices", body: "The documented workflow searches for up to four completed years of land-price observations and displays normalized prices per square foot." },
//     { heading: "Five-year forecast", body: "A Bayesian Ridge regression model is used to project the next five years from available historical observations. Forecast charts may include upper and lower bands." },
//     { heading: "What the chart means", body: "Historical values describe the evidence found for earlier periods. Forecast values are statistical projections and should not be interpreted as future sale prices." },
//     { heading: "When a forecast is unavailable", body: "A forecast may be omitted if the historical evidence is insufficient or fails validation. Changing the display unit does not retrain the model." },
//   ]},
//   { id: "units", title: "Area and price units", eyebrow: "MEASUREMENTS", summary: "LandWise lets users read property area and price rates in different units.", blocks: [
//     { heading: "Supported units", body: "The documented display units include square feet, square yards, square meters, acres, hectares, cents, guntas, marlas and bighas." },
//     { heading: "How conversion works", body: "The backend maintains comparable rates in rupees per square foot. The frontend converts those values to the selected display unit." },
//     { heading: "Why units matter", body: "Converting values to the same unit makes listings easier to compare and helps avoid misleading comparisons between different plot sizes." },
//     { heading: "Regional differences", body: "Some traditional land units, especially bigha, vary by location. Their conversions should be treated as approximate." },
//   ]},
//   { id: "affordability", title: "Affordability calculator", eyebrow: "BUDGET PLANNING", summary: "Affordability starts with a budget and estimates what property options may fit within it.", blocks: [
//     { heading: "Land and plots", body: "For land, the application uses estimated local rates to calculate how much area the entered budget might cover." },
//     { heading: "Residential properties", body: "For flats, villas and independent houses, the documented analysis compares possibilities across one to five bedrooms (1–5 BHK), along with available property-status choices." },
//     { heading: "Commercial properties", body: "Commercial affordability can consider offices, shops, commercial floors and warehouses." },
//     { heading: "How to interpret results", body: "The result is a planning aid based on estimated market rates. It does not guarantee a listing is available or include every tax, registration cost, loan charge or legal expense." },
//   ]},
//   { id: "assistant", title: "AI chatbot and RAG", eyebrow: "ASSISTED RESEARCH", summary: "The assistant answers questions using relevant saved results and available help material.", blocks: [
//     { heading: "What RAG means", body: "Retrieval-augmented generation (RAG) means the application first finds relevant information and then supplies it to an AI model to help compose an answer." },
//     { heading: "Information sources", body: "The documented retrieval process can use the signed-in user’s saved searches and shared text or Markdown knowledge documents. It ranks relevant passages with TF-IDF retrieval." },
//     { heading: "Gemini’s role", body: "Google Gemini generates a readable explanation using the retrieved evidence and conversation context. It should not invent unsupported market prices." },
//     { heading: "Ask about this result", body: "From an estimate or History, users can open a conversation associated with a specific saved search, helping the assistant answer questions about that result." },
//     { heading: "Land-price questions", body: "The documented chat upgrade can route explicit land or plot price questions that include a location to the existing property estimator. Other property types are not covered by that chat-specific valuation feature." },
//     { heading: "Voice input", body: "Where supported, browser speech recognition converts a spoken question into editable text. The user reviews it before sending; the feature does not create a separate valuation process." },
//     { heading: "Guest access", body: "A guest chat entry point appears on the public experience, but authenticated conversations require login." },
//   ]},
//   { id: "history", title: "Search history and conversations", eyebrow: "SAVED RESEARCH", summary: "Signed-in users can return to earlier analyses without entering the same details again.", blocks: [
//     { heading: "Saved searches", body: "The backend stores property-price and affordability requests and their results under the user’s account." },
//     { heading: "History page", body: "Users can review earlier results, open an item and delete individual search records." },
//     { heading: "Conversation history", body: "The documented chat system stores conversations and messages so users can return to previous discussions and remove conversations." },
//     { heading: "Old results", body: "A saved estimate reflects information available when it was created. Opening it does not mean the property price has been recalculated today." },
//   ]},
//   { id: "architecture", title: "Technology and data flow", eyebrow: "TECHNICAL OVERVIEW", summary: "LandWise separates the website interface from the services that process data.", blocks: [
//     { heading: "Frontend", body: "React, TypeScript and Vite power the browser interface, forms, charts and navigation." },
//     { heading: "Backend", body: "Python and FastAPI handle authentication, property estimation, affordability, saved records and chatbot requests." },
//     { heading: "Market evidence and forecasting", body: "Tavily provides source discovery and extraction. Validation and price normalization support estimates; Bayesian Ridge is used for documented land-price forecasts." },
//     { heading: "AI and retrieval", body: "Gemini produces chatbot answers using evidence selected from saved searches and shared knowledge." },
//     { heading: "Data and email", body: "MongoDB stores account-related data and research history. The deployed application uses Brevo to send email OTPs." },
//     { heading: "Location services", body: "OpenStreetMap, Leaflet and Nominatim support map selection and address lookup." },
//     { heading: "Request flow", body: "The browser sends a request to FastAPI. The backend processes the request, accesses required services and returns the result for the frontend to display." },
//   ]},
//   { id: "limitations", title: "Accuracy and limitations", eyebrow: "IMPORTANT DETAILS", summary: "These points help users interpret the application correctly.", blocks: [
//     { heading: "Asking prices versus sale prices", body: "Publicly advertised prices may be asking prices rather than prices paid in completed transactions." },
//     { heading: "Locality coverage", body: "Some areas or property types have limited usable evidence, so estimates and historical charts may be unavailable." },
//     { heading: "Forecast uncertainty", body: "Five-year projections depend on historical data and modelling assumptions. They are not guarantees or investment advice." },
//     { heading: "Map and voice availability", body: "Map tiles, geocoding and browser speech recognition depend on external services, device permissions and browser support." },
//     { heading: "Professional verification", body: "Before purchasing property, users should independently verify ownership, records, boundaries, approvals, taxes and legal status with appropriate professionals." },
//   ]},
//   { id: "faq", title: "Frequently asked questions", eyebrow: "QUICK REFERENCE", summary: "Short answers to common questions about LandWise.", blocks: [
//     { heading: "Does LandWise sell properties?", body: "The documented application is a property research and estimation tool, not a property purchase or brokerage service." },
//     { heading: "Is the estimate an official valuation?", body: "No. It is an indicative estimate based on usable public evidence." },
//     { heading: "Can I use the map instead of typing a location?", body: "Yes. The location picker can fill the address field after a place is selected." },
//     { heading: "Does the chatbot calculate all property prices?", body: "The documented chat valuation upgrade specifically covers explicit land or plot price requests with a location. The main estimator supports additional property workflows." },
//     { heading: "Why is there no forecast for some places?", body: "A forecast needs enough validated historical land-price observations." },
//     { heading: "Are previous searches updated automatically?", body: "No. Run a new estimate to request a fresh analysis." },
//     { heading: "Do I need an account?", body: "The landing page and documentation are public. Estimation, history and saved conversations use authenticated access." },
//   ]},
// ];

// export default function Docs({ onBack, onGetStarted }: { onBack: () => void; onGetStarted: () => void }) {
//   const [selected, setSelected] = useState("overview");
//   const [query, setQuery] = useState("");
//   const filtered = useMemo(() => sections.filter(s => `${s.title} ${s.summary} ${s.blocks.map(b => `${b.heading} ${b.body}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
//   const active = sections.find(s => s.id === selected) || sections[0];
//   const choose = (id: string) => { setSelected(id); window.scrollTo({ top: 0, behavior: "smooth" }); };
//   return <main className="lw-docs-page">
//     <div className="lw-docs-container">
//       <header className="lw-docs-topbar"><div className="brand"><span className="brand-icon"><Sparkles size={15}/></span><span>LandWise <b>AI</b></span></div><div className="lw-docs-header-actions"><button className="ghost-btn" onClick={onBack}><ArrowLeft size={15}/> Back to website</button><button className="analyze" onClick={onGetStarted}>Get started <ArrowRight size={15}/></button></div></header>
//       <div className="lw-docs-hero"><span className="lw-docs-kicker"><BookOpen size={15}/> APPLICATION GUIDE</span><h1>LandWise <span>Documentation</span></h1><p>Clear explanations of the application, its features and how each part works.</p></div>
//       <div className="lw-docs-layout"><aside className="lw-docs-sidebar" aria-label="Documentation navigation"><div className="lw-docs-search"><Search size={16}/><input aria-label="Search documentation" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search documentation..."/></div><div className="lw-docs-sidebar-label">CONTENTS</div><nav>{filtered.map(s => <button key={s.id} className={active.id === s.id ? "lw-docs-nav active" : "lw-docs-nav"} onClick={() => choose(s.id)}><span>{s.title}</span><ChevronRight size={15}/></button>)}{filtered.length === 0 && <p className="lw-docs-empty">No matching topics.</p>}</nav><div className="lw-docs-sidebar-note"><Compass size={17}/><span>Select any topic to read its explanation.</span></div></aside>
//       <article className="lw-docs-article" key={active.id}><div className="lw-docs-eyebrow">{active.eyebrow}</div><h2>{active.title}</h2><p className="lw-docs-intro">{active.summary}</p><div className="lw-docs-blocks">{active.blocks.map(b => <section key={b.heading} className="lw-docs-block"><h3>{b.heading}</h3><p>{b.body}</p>{b.points && <ul>{b.points.map(p => <li key={p}>{p}</li>)}</ul>}</section>)}</div><div className="lw-docs-next">{(() => { const next = sections[sections.findIndex(s => s.id === active.id) + 1]; return next ? <button onClick={() => choose(next.id)}><span><small>UP NEXT</small><strong>{next.title}</strong></span><ArrowRight size={19}/></button> : <button onClick={() => choose("overview")}><span><small>CONTINUE READING</small><strong>Back to introduction</strong></span><ArrowRight size={19}/></button>; })()}</div></article></div>
//       <footer className="lw-docs-footer">LandWise AI · Application documentation</footer>
//     </div>
//   </main>;
// }


import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Compass, Search, Sparkles } from "lucide-react";
import "./Docs.css";
import ArchitectureFlow from "../components/ArchitectureFlow";

type Section = { id: string; title: string; eyebrow: string; summary: string; blocks: { heading: string; body: string; points?: string[] }[] };

const sections: Section[] = [
  { id: "overview", title: "What is LandWise?", eyebrow: "INTRODUCTION", summary: "LandWise AI is a web application for researching property prices and understanding what a budget may afford.", blocks: [
    { heading: "Purpose", body: "LandWise brings property research into one place. Users can search for a location, request an estimated property price, review available market evidence and save their results." },
    { heading: "Who uses it?", body: "It is intended for prospective buyers, landowners and people comparing property options. Managers and clients can use these pages to understand the product without a live demonstration." },
    { heading: "What does an estimate mean?", body: "An estimate is an indicative calculation based on usable public market evidence. It is not a government valuation, a confirmed transaction price or a guarantee of the amount a property will sell for." },
  ]},
  { id: "landing", title: "Landing page", eyebrow: "WEBSITE GUIDE", summary: "The landing page is the public introduction to LandWise AI.", blocks: [
    { heading: "Introduction section", body: "The opening section explains the application and provides actions to create an account or sign in. A background video supports the visual presentation." },
    { heading: "Feature descriptions", body: "The feature section introduces evidence-based price estimates, property affordability and the way the application handles missing data." },
    { heading: "How it works", body: "The landing page outlines the basic process: find relevant property sources, extract usable price and area information, compare values on a common unit basis and display the result." },
    { heading: "Navigation", body: "Visitors can read Docs without signing in. Price estimation, account history and the authenticated assistant are accessed through the signed-in application." },
  ]},
  { id: "account", title: "Accounts and email OTP", eyebrow: "USER ACCESS", summary: "Accounts protect personal search history and conversations.", blocks: [
    { heading: "Sign up", body: "A new user enters the required account details and receives a one-time password (OTP) by email. The OTP is used to verify the address before account access is completed." },
    { heading: "Log in", body: "Registered users sign in to access the estimator, affordability tool, history and chatbot." },
    { heading: "Forgot password", body: "The password-recovery process sends an OTP to the registered email address before a new password can be set." },
    { heading: "Security", body: "The documented backend uses password hashing, time-limited OTPs with attempt limits and JWT-based authentication. Private credentials are kept on the backend." },
  ]},
  { id: "journey", title: "Using the application", eyebrow: "USER WORKFLOW", summary: "The usual workflow is to sign in, select a location, run an analysis and review the result.", blocks: [
    { heading: "Step 1 — Choose a task", body: "Open the estimator to check a property price or switch to affordability to begin with a budget." },
    { heading: "Step 2 — Enter details", body: "Choose the property type and location. For estimation, provide an area and its unit; for affordability, provide a budget and relevant property options." },
    { heading: "Step 3 — Review the result", body: "Read the estimated amount, comparable rates, ranges and other available information. Some sections appear only when the backend has sufficient data." },
    { heading: "Step 4 — Save and revisit", body: "Signed-in searches can be revisited in History. The assistant can help explain supported results and concepts." },
  ]},
  { id: "property", title: "Property price estimation", eyebrow: "PRICE RESEARCH", summary: "The estimator calculates an indicative price using relevant property evidence for the selected area.", blocks: [
    { heading: "Supported property types", body: "The documented workflows cover land or plots, residential properties and commercial properties. Residential options include flats, villas and independent houses; commercial choices include offices, shops, floors and warehouses." },
    { heading: "Inputs", body: "The user selects a location, property type, area and area unit. Depending on the property, the form may ask for additional details such as property status or commercial purpose." },
    { heading: "Source discovery", body: "Tavily Search finds candidate property pages and Tavily Extract retrieves selected page content. The backend looks for explicit price and area values relevant to the requested locality." },
    { heading: "Evidence validation", body: "The system checks that extracted values represent usable property information rather than unrelated numbers. It converts valid observations to a common price-per-square-foot basis." },
    { heading: "Estimated result", body: "Comparable rates are used to calculate an estimated rate and total price for the requested area. The result can also show a typical price range and supporting sources." },
    { heading: "Insufficient evidence", body: "If there are too few reliable observations, the estimator may report that a price cannot be determined instead of creating an unsupported figure." },
  ]},
  { id: "map", title: "Selecting a location on the map", eyebrow: "LOCATION INPUT", summary: "The map helps users select an address without typing it manually.", blocks: [
    { heading: "Open the map", body: "Use Select on Map in the property form to open the OpenStreetMap-based location picker." },
    { heading: "Choose a place", body: "Search for a place, click the map, move the marker or use browser location permission when available." },
    { heading: "Confirm the address", body: "The picker uses reverse geocoding to turn selected coordinates into a readable address and fills the location field." },
    { heading: "How it affects estimation", body: "The selected address is passed into the existing estimation workflow. The map is a location-input tool; it does not calculate property prices itself." },
  ]},
  { id: "trends", title: "Historical trends and forecasts", eyebrow: "PRICE TRENDS", summary: "For land-price searches with enough usable historical data, LandWise can display past observations and projected trends.", blocks: [
    { heading: "Historical prices", body: "The documented workflow searches for up to four completed years of land-price observations and displays normalized prices per square foot." },
    { heading: "Five-year forecast", body: "A Bayesian Ridge regression model is used to project the next five years from available historical observations. Forecast charts may include upper and lower bands." },
    { heading: "What the chart means", body: "Historical values describe the evidence found for earlier periods. Forecast values are statistical projections and should not be interpreted as future sale prices." },
    { heading: "When a forecast is unavailable", body: "A forecast may be omitted if the historical evidence is insufficient or fails validation. Changing the display unit does not retrain the model." },
  ]},
  { id: "units", title: "Area and price units", eyebrow: "MEASUREMENTS", summary: "LandWise lets users read property area and price rates in different units.", blocks: [
    { heading: "Supported units", body: "The documented display units include square feet, square yards, square meters, acres, hectares, cents, guntas, marlas and bighas." },
    { heading: "How conversion works", body: "The backend maintains comparable rates in rupees per square foot. The frontend converts those values to the selected display unit." },
    { heading: "Why units matter", body: "Converting values to the same unit makes listings easier to compare and helps avoid misleading comparisons between different plot sizes." },
    { heading: "Regional differences", body: "Some traditional land units, especially bigha, vary by location. Their conversions should be treated as approximate." },
  ]},
  { id: "affordability", title: "Affordability calculator", eyebrow: "BUDGET PLANNING", summary: "Affordability starts with a budget and estimates what property options may fit within it.", blocks: [
    { heading: "Land and plots", body: "For land, the application uses estimated local rates to calculate how much area the entered budget might cover." },
    { heading: "Residential properties", body: "For flats, villas and independent houses, the documented analysis compares possibilities across one to five bedrooms (1–5 BHK), along with available property-status choices." },
    { heading: "Commercial properties", body: "Commercial affordability can consider offices, shops, commercial floors and warehouses." },
    { heading: "How to interpret results", body: "The result is a planning aid based on estimated market rates. It does not guarantee a listing is available or include every tax, registration cost, loan charge or legal expense." },
  ]},
  { id: "assistant", title: "AI chatbot and RAG", eyebrow: "ASSISTED RESEARCH", summary: "The assistant answers questions using relevant saved results and available help material.", blocks: [
    { heading: "What RAG means", body: "Retrieval-augmented generation (RAG) means the application first finds relevant information and then supplies it to an AI model to help compose an answer." },
    { heading: "Information sources", body: "The documented retrieval process can use the signed-in user’s saved searches and shared text or Markdown knowledge documents. It ranks relevant passages with TF-IDF retrieval." },
    { heading: "Gemini’s role", body: "Google Gemini generates a readable explanation using the retrieved evidence and conversation context. It should not invent unsupported market prices." },
    { heading: "Ask about this result", body: "From an estimate or History, users can open a conversation associated with a specific saved search, helping the assistant answer questions about that result." },
    { heading: "Land-price questions", body: "The documented chat upgrade can route explicit land or plot price questions that include a location to the existing property estimator. Other property types are not covered by that chat-specific valuation feature." },
    { heading: "Voice input", body: "Where supported, browser speech recognition converts a spoken question into editable text. The user reviews it before sending; the feature does not create a separate valuation process." },
    { heading: "Guest access", body: "A guest chat entry point appears on the public experience, but authenticated conversations require login." },
  ]},
  { id: "history", title: "Search history and conversations", eyebrow: "SAVED RESEARCH", summary: "Signed-in users can return to earlier analyses without entering the same details again.", blocks: [
    { heading: "Saved searches", body: "The backend stores property-price and affordability requests and their results under the user’s account." },
    { heading: "History page", body: "Users can review earlier results, open an item and delete individual search records." },
    { heading: "Conversation history", body: "The documented chat system stores conversations and messages so users can return to previous discussions and remove conversations." },
    { heading: "Old results", body: "A saved estimate reflects information available when it was created. Opening it does not mean the property price has been recalculated today." },
  ]},
  { id: "architecture", title: "Technology and data flow", eyebrow: "TECHNICAL OVERVIEW", summary: "LandWise separates the website interface from the services that process data.", blocks: [
    { heading: "Frontend", body: "React, TypeScript and Vite power the browser interface, forms, charts and navigation." },
    { heading: "Backend", body: "Python and FastAPI handle authentication, property estimation, affordability, saved records and chatbot requests." },
    { heading: "Market evidence and forecasting", body: "Tavily provides source discovery and extraction. Validation and price normalization support estimates; Bayesian Ridge is used for documented land-price forecasts." },
    { heading: "AI and retrieval", body: "Gemini produces chatbot answers using evidence selected from saved searches and shared knowledge." },
    { heading: "Data and email", body: "MongoDB stores account-related data and research history. The deployed application uses Brevo to send email OTPs." },
    { heading: "Location services", body: "OpenStreetMap, Leaflet and Nominatim support map selection and address lookup." },
    { heading: "Request flow", body: "The browser sends a request to FastAPI. The backend processes the request, accesses required services and returns the result for the frontend to display." },
  ]},
  { id: "limitations", title: "Accuracy and limitations", eyebrow: "IMPORTANT DETAILS", summary: "These points help users interpret the application correctly.", blocks: [
    { heading: "Asking prices versus sale prices", body: "Publicly advertised prices may be asking prices rather than prices paid in completed transactions." },
    { heading: "Locality coverage", body: "Some areas or property types have limited usable evidence, so estimates and historical charts may be unavailable." },
    { heading: "Forecast uncertainty", body: "Five-year projections depend on historical data and modelling assumptions. They are not guarantees or investment advice." },
    { heading: "Map and voice availability", body: "Map tiles, geocoding and browser speech recognition depend on external services, device permissions and browser support." },
    { heading: "Professional verification", body: "Before purchasing property, users should independently verify ownership, records, boundaries, approvals, taxes and legal status with appropriate professionals." },
  ]},
  { id: "faq", title: "Frequently asked questions", eyebrow: "QUICK REFERENCE", summary: "Short answers to common questions about LandWise.", blocks: [
    { heading: "Does LandWise sell properties?", body: "The documented application is a property research and estimation tool, not a property purchase or brokerage service." },
    { heading: "Is the estimate an official valuation?", body: "No. It is an indicative estimate based on usable public evidence." },
    { heading: "Can I use the map instead of typing a location?", body: "Yes. The location picker can fill the address field after a place is selected." },
    { heading: "Does the chatbot calculate all property prices?", body: "The documented chat valuation upgrade specifically covers explicit land or plot price requests with a location. The main estimator supports additional property workflows." },
    { heading: "Why is there no forecast for some places?", body: "A forecast needs enough validated historical land-price observations." },
    { heading: "Are previous searches updated automatically?", body: "No. Run a new estimate to request a fresh analysis." },
    { heading: "Do I need an account?", body: "The landing page and documentation are public. Estimation, history and saved conversations use authenticated access." },
  ]},
];

export default function Docs({ onBack, onGetStarted }: { onBack: () => void; onGetStarted: () => void }) {
  const [selected, setSelected] = useState("overview");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => sections.filter(s => `${s.title} ${s.summary} ${s.blocks.map(b => `${b.heading} ${b.body}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const active = sections.find(s => s.id === selected) || sections[0];
  const choose = (id: string) => { setSelected(id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <main className="lw-docs-page">
    <div className="lw-docs-container">
      <header className="lw-docs-topbar"><div className="brand"><span className="brand-icon"><Sparkles size={15}/></span><span>LandWise <b>AI</b></span></div><div className="lw-docs-header-actions"><button className="ghost-btn" onClick={onBack}><ArrowLeft size={15}/> Back to website</button><button className="analyze" onClick={onGetStarted}>Get started <ArrowRight size={15}/></button></div></header>
      <div className="lw-docs-hero"><span className="lw-docs-kicker"><BookOpen size={15}/> APPLICATION GUIDE</span><h1>LandWise <span>Documentation</span></h1><p>Clear explanations of the application, its features and how each part works.</p></div>
      <div className="lw-docs-layout"><aside className="lw-docs-sidebar" aria-label="Documentation navigation"><div className="lw-docs-search"><Search size={16}/><input aria-label="Search documentation" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search documentation..."/></div><div className="lw-docs-sidebar-label">CONTENTS</div><nav>{filtered.map(s => <button key={s.id} className={active.id === s.id ? "lw-docs-nav active" : "lw-docs-nav"} onClick={() => choose(s.id)}><span>{s.title}</span><ChevronRight size={15}/></button>)}{filtered.length === 0 && <p className="lw-docs-empty">No matching topics.</p>}</nav><div className="lw-docs-sidebar-note"><Compass size={17}/><span>Select any topic to read its explanation.</span></div></aside>
      <article className="lw-docs-article" key={active.id}><div className="lw-docs-eyebrow">{active.eyebrow}</div><h2>{active.title}</h2><p className="lw-docs-intro">{active.summary}</p><div className="lw-docs-blocks">{active.blocks.map(b => <section key={b.heading} className="lw-docs-block"><h3>{b.heading}</h3><p>{b.body}</p>{b.points && <ul>{b.points.map(p => <li key={p}>{p}</li>)}</ul>}</section>)}</div>{active.id === "architecture" && <ArchitectureFlow />}<div className="lw-docs-next">{(() => { const next = sections[sections.findIndex(s => s.id === active.id) + 1]; return next ? <button onClick={() => choose(next.id)}><span><small>UP NEXT</small><strong>{next.title}</strong></span><ArrowRight size={19}/></button> : <button onClick={() => choose("overview")}><span><small>CONTINUE READING</small><strong>Back to introduction</strong></span><ArrowRight size={19}/></button>; })()}</div></article></div>
      <footer className="lw-docs-footer">LandWise AI · Application documentation</footer>
    </div>
  </main>;
}
