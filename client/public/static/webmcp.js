/* WebMCP — expose Obour Guide tools to in-browser agents (navigator.modelContext). */
(function () {
  if (!("modelContext" in navigator) || !navigator.modelContext || !navigator.modelContext.registerTool) return;
  var mc = navigator.modelContext;

  // AbortController: all tools unregister cleanly when no longer needed
  // (e.g., page teardown / SPA navigation). signal is passed per registration.
  var controller = new AbortController();
  var signal = controller.signal;

  mc.registerTool({
    name: "search_obour_services",
    description: "Search the verified Obour / New Obour local-services directory (2,040 listings: name, category, area, phone). Arabic or English query.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "e.g. 'صيدلية' or 'pharmacy' or 'إطارات'" },
        limit: { type: "integer", minimum: 1, maximum: 25 },
      },
      required: ["query"],
    },
    execute: async function (args) {
      var limit = Math.min(Math.max((args && args.limit) || 10, 1), 25);
      var q = String((args && args.query) || "").toLowerCase();
      var res = await fetch("/data/obour-directories.json");
      var data = await res.json();
      var hits = (data.items || [])
        .filter(function (it) {
          return [it.name, it.englishName, it.category, it.area, it.directoryTitle]
            .filter(Boolean)
            .some(function (f) { return String(f).toLowerCase().indexOf(q) !== -1; });
        })
        .slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify(hits, null, 1) }] };
    },
  }, { signal: signal });

  mc.registerTool({
    name: "list_obour_datasets",
    description: "List the open datasets published by Obour Guide (districts, compounds, developers, schools, services directory) with download URLs.",
    inputSchema: { type: "object", properties: {} },
    execute: async function () {
      var res = await fetch("/data/openapi.json");
      var spec = await res.json();
      var sets = Object.keys(spec.paths || {}).filter(function (p) { return p.endsWith(".json"); });
      return { content: [{ type: "text", text: JSON.stringify(sets.map(function (p) { return "https://obourguide.com" + p; }), null, 1) }] };
    },
  }, { signal: signal });

  mc.registerTool({
    name: "navigate_obour_guide",
    description: "Navigate to a section of the Obour city guide (e.g. /prices/, /districts/, /pharmacies/, /compare/).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Site path like /pharmacies/ or /districts/" } },
      required: ["path"],
    },
    execute: async function (args) {
      var path = String((args && args.path) || "/");
      if (path.charAt(0) !== "/") path = "/" + path;
      window.location.assign(path);
      return { content: [{ type: "text", text: "Navigating to " + path }] };
    },
  }, { signal: signal });

  // Expose teardown for hosts that support it (and for future SPA navigation)
  window.addEventListener("pagehide", function () { controller.abort(); });
})();
