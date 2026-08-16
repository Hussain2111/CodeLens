# CodeSnap Rebuild (project)
## Stage 0 — Repo, toolchain, and a running skeleton
> A new repo has a React+Vite frontend and a FastAPI backend running side by side locally, the frontend calls the backend's /health endpoint and displays the result, and both are committed with a README stating the stack.
### Repo and structure
- Create a new GitHub repo with Node and Python gitignores and an MIT license https://github.com/github/gitignore @20m
| A fresh repo rather than a fork is deliberate. The old CodeSnap was AI-built and can't be defended; a clean commit history is itself the evidence the work is mine. Both gitignores because this is a monorepo.
- Decide the monorepo layout, frontend and backend as top-level folders, and write it in the README @20m
| Deciding the layout now prevents painful moves once imports and configs reference paths. Two top-level folders keep the npm and pip toolchains cleanly separated.
- Commit a README with the title, one-line description, chosen stack, and current status @20m
| The README is the running log for the whole rebuild. Starting it now means each stage appends to it rather than it being written at the end, which never goes well.
### Backend skeleton
- Create a Python virtual environment in the backend folder and install FastAPI and uvicorn https://docs.python.org/3/library/venv.html @30m
| A virtualenv isolates this project's packages so versions never clash with other projects. FastAPI defines the app, uvicorn serves it — the same split as Express needing listen.
- Write a FastAPI app with a GET /health endpoint returning a status object and run it with uvicorn https://fastapi.tiangolo.com/tutorial/first-steps/ @45m
| A health endpoint is a real convention — deployment platforms ping it to know the service is alive. Starting with the smallest possible endpoint means when it works, the framework, server and virtualenv are all confirmed correct before any real logic exists.
- Capture the dependencies in requirements.txt or pyproject @15m
| This is how a clean machine, or a deployment platform, reinstalls the exact packages. Capture them the moment they're added, not at the end when you've forgotten which were deliberate.
### Frontend skeleton
- Scaffold a React and TypeScript app with Vite in the frontend folder https://vite.dev/guide/ @30m
| Vite compiles the React and TypeScript and serves it with hot reload. TypeScript because it's what jobs expect and it catches errors before runtime. Vite rather than Next.js because this is a client-side camera PWA with no server rendering or SEO needs — being able to say that is a real interview point.
- Run the default Vite app and strip it back to an empty shell @20m
| Running the default confirms the toolchain works. Stripping it now gives a clean canvas, which is easier than deleting boilerplate from around your own code later.
- Call the backend health endpoint from the frontend and render the result, fixing the CORS error you will hit https://fastapi.tiangolo.com/tutorial/cors/ @45m
| The first real integration. You will get a CORS error because the browser blocks requests from the frontend's origin to a different origin unless the server explicitly allows it. Meeting CORS now on a trivial endpoint means understanding it before it blocks the real image call.

## Stage 1 — The extraction backend
> POST /extract accepts a base64 image, calls Gemini with a code-extraction prompt, and returns the code and detected language; posting a real photo of code via curl returns sensible output; the API key is read from an environment variable and never committed.
### Gemini access
- Get a Gemini API key from Google AI Studio and store it in a gitignored .env file https://aistudio.google.com/ @20m
| This replaces the dead hackathon credits with a new free-tier key and no billing. The key is a secret: committing it would let anyone drain or abuse the quota, so it lives in .env, loaded at runtime.
- Read the Gemini free-tier rate limits and write them into the README as a known constraint https://ai.google.dev/gemini-api/docs/rate-limits @20m
| The free tier caps requests per minute and per day. Knowing the numbers shapes the rate-limiting decision in Stage 4, and documenting it now makes the constraint a design input rather than a production surprise.
- Write a throwaway script that sends one hardcoded image to Gemini and prints the response https://ai.google.dev/gemini-api/docs @45m
| This isolates the model call from the web framework. Proving you can talk to Gemini at all, before wiring it into FastAPI, means that when the real endpoint misbehaves you already know which half is broken.
### The endpoint
- Define the request and response shapes with Pydantic models https://fastapi.tiangolo.com/tutorial/body/ @30m
| Pydantic declares the exact JSON the endpoint accepts and returns, and FastAPI uses it to reject malformed requests automatically. Keeping the original contract means the frontend logic maps over cleanly.
- Write POST /extract taking the base64 image, calling Gemini with a prompt that extracts code and detects language @90m
| This is the missing brain — the original repo pointed at a backend that never existed. The prompt matters: tell the model this is a photo of code, return only the code preserving indentation, and name the language. A multimodal model does this better than pure OCR because it understands code structure.
- Handle the data URL prefix and base64 decoding of what the frontend actually sends https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs @45m
| The browser canvas produces a string beginning with data:image/jpeg;base64, and that prefix is metadata, not image data. Failing to strip it is a silent bug — the model just rejects the image.
- Add error handling for rate limits, bad images and no-code-found, returning meaningful status codes https://fastapi.tiangolo.com/tutorial/handling-errors/ @45m
| A public app will hit rate limits and receive junk photos. Returning a clear 429 or 422 rather than a generic 500 lets the frontend tell the user something useful, and building the error paths alongside the happy path avoids retrofitting them after deployment surfaces them.
### Prove it
- Post a real photo of code through the auto-generated /docs UI and confirm sensible extraction @30m
| FastAPI generates an interactive API page for free, so no separate tool is needed. Test with an actual lecture-screen photo rather than a clean screenshot — that's where the accuracy limits show.

## Stage 2 — The frontend
> The React PWA opens the camera, captures a photo, sends it to the backend and displays the extracted code; every component, hook and piece of state can be explained; it runs on a phone over the local network.
### Routing and shell
- Add React Router and define the landing, camera and result routes https://reactrouter.com/ @45m
| Routing maps URLs to components so the app has real navigable views instead of one giant conditional. Deciding the skeleton first stops navigation being refactored later.
- Build the landing page component https://react.dev/learn/your-first-component @45m
| Start with the simplest screen to relearn React fundamentals by writing them. The original's landing page was AI-written; writing your own, however simple, is what makes "walk me through this component" answerable.
### Camera capture
- Learn getUserMedia and render a live camera preview using a ref https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia @60m
| getUserMedia asks the browser for camera access and returns a stream you attach to a video element through a ref. This is genuinely tricky React — refs and cleanup are exactly what interviewers probe.
- Capture a still frame to a canvas and convert it to a base64 JPEG https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos @60m
| Draw the current video frame onto a hidden canvas, then toDataURL gives the base64 string the backend expects. The video to canvas to data URL pipeline is a good thing to be able to explain.
- Model the component state across streaming, captured, extracting and result, and stop the stream on cleanup https://react.dev/learn/synchronizing-with-effects @60m
| The camera screen moves through clear states and useState drives that. Critically the stream must be stopped when done or the camera light stays on and the device stays held. Getting state modelling right early prevents the tangled conditionals that make components unexplainable.
### Wire to the backend
- Send the captured image to the extract endpoint and handle loading, success and error in the UI https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API @60m
| This closes the loop. Handling all three states is what makes it feel like an app rather than a happy-path demo.
- Display the extracted code preserving whitespace and showing the detected language @30m
| A pre element preserves the indentation that matters enormously for code. Syntax highlighting is polish for later — a plain readable display is enough to prove the pipeline.
- Add copy to clipboard https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API @30m
| Copying is the payoff and completes the core value loop. With this the app is genuinely usable before the extension exists.
### Run it on a phone
- Serve the frontend over the local network and open it on your phone, solving the secure-context requirement https://vite.dev/config/server-options.html @60m
| Camera APIs only work on HTTPS or localhost, so a real phone over the LAN needs a self-signed cert or a tunnel. This is a phone-first app and desktop webcam testing hides real issues.

## Stage 3 — PWA and the VS Code extension
> The app is installable on a phone with an icon and an offline shell; the extension pairs by QR code and opens received code in a new editor tab.
### Make it a real PWA
- Add a web app manifest with name, icons, theme colour and display mode https://developer.mozilla.org/en-US/docs/Web/Manifest @45m
| The manifest is what lets a browser install the site as an app with its own icon and no browser chrome. This is the concrete meaning of a deployable phone app without going native.
- Add a service worker for the installable offline shell https://vite-pwa-org.netlify.app/ @45m
| A service worker caches the app shell so it loads instantly and works offline — the shell, not the AI call, which needs network. It's the technical requirement for installability.
- Verify installability on the phone with an add-to-home-screen test and a Lighthouse audit @30m
| Lighthouse states exactly what's missing for installability. Confirming on the actual device is the proof the PWA claim is real.
### Rebuild the extension
- Scaffold a fresh TypeScript VS Code extension with the pairing and receive commands https://code.visualstudio.com/api/get-started/your-first-extension @60m
| The extension is the differentiator — it's what makes this more than a photo-OCR app. Rebuilding it yourself is what makes the WebSocket pairing explainable in an interview.
- Implement the WebSocket server, QR pairing encoding the LAN address, and opening received code in an editor tab @90m
| The extension runs a small WebSocket server; the phone scans a QR containing the machine's address, connects, and sends code which opens in a new tab. The old extension.ts can be read to understand the flow, but write your own.
- Connect the phone app to the extension by scanning the QR and sending over WebSocket https://developer.mozilla.org/en-US/docs/Web/API/WebSocket @60m
| This closes the second loop and reuses the camera already built, now for QR scanning. With both halves done, this is the integration that delivers the full demo.

## Stage 4 — Deploy it
> The backend is reachable over the internet, the frontend PWA is at a public URL and installable on any phone, the API key is server-side only and rate-limited, and a stranger can open the URL and extract code.
### Protect the key and the quota
- Confirm the key is only ever used server-side and add rate limiting to the extract endpoint https://github.com/laurentS/slowapi @60m
| The single most important deployment decision and a strong interview point: the key lives on the backend so the frontend never sees it and nobody can pull it out of browser code. Rate limiting stops one person or a bot draining the daily free quota.
- Add input validation and a size limit on the uploaded image @45m
| A public endpoint will receive oversized and malformed uploads. Capping image size protects both the server and the Gemini quota, since larger images cost more tokens.
### Deploy the backend
- Choose a free-tier host for FastAPI and deploy it @90m
| The backend must be internet-reachable for the deployed frontend to call it. Free tiers change often, so check current limits — some sleep after inactivity, which is fine for a portfolio demo. Deploy this first so there's a real URL to point the frontend at.
- Set the Gemini key as a secret in the host rather than in the repo @30m
| The same discipline as local development, now in production. The key goes in the platform's secret store and never into deployed code.
- Confirm the deployed backend answers both endpoints from the public internet @30m
| Proving the live endpoints work before touching the frontend isolates deployment problems from frontend problems.
### Deploy the frontend
- Point the frontend at the deployed backend through a build-time environment variable and deploy the PWA to a static host https://vite.dev/guide/env-and-mode.html @60m
| The frontend must call the live backend, not localhost, so the URL comes from an env var at build time. Static hosts give HTTPS automatically, which the camera API requires.
- Verify the whole flow on a phone over the public internet and add the production origin to the CORS allow-list @45m
| The allow-list set locally must now include the deployed frontend's origin or the browser blocks the call — the classic works-locally-breaks-in-prod bug. Testing snap to extract to copy on a real phone is the final proof.

## Stage 5 — Presentable and defendable
> The README explains what it is, how to run it, the architecture and the key design decisions; a live link and a short recording exist; every file can be explained.
### Documentation
- Write the README with the pitch, the live link, local setup, and the stack with reasoning @60m
| This is what a recruiter reads first. Leading with a live link and a one-line pitch, then stack-with-reasoning, signals judgment. It's where the Vite-not-Next, FastAPI, free-tier and key-behind-backend decisions get recorded as deliberate.
- Draw the architecture diagram in Mermaid covering both data flows https://mermaid.js.org/ @60m
| A diagram makes the extraction path and the phone-to-editor path legible at a glance, and Mermaid renders directly in the README with no image files. Narrating a request lifecycle over a diagram is a strong interview move.
- Record a demo under two minutes and link it @45m
| A recording proves the app works without the viewer setting anything up. Interviewers won't run your code and a live demo can fail on their network, so this is the most convincing single artefact.
### Decisions and limits
- Write up three design decisions with reasoning @45m
| The key behind a rate-limited backend, Vite over a meta-framework, and the free tier with its constraints. Each is a real judgment call with a defensible why, which is what separates a project you built from one you can explain.
- Write the known-limitations section @45m
| OCR accuracy on poor photos, free-tier rate limits, no auth on the extension. Naming limits honestly is a strength and pre-empts the "what would break this" question with a considered answer.
- Run a clean clone end to end, then tag v1.0.0 and push @45m
| A clean-clone run proves the quickstart actually works, which it never does first time. Tagging marks a finished milestone — the thing the previous projects never reached.
