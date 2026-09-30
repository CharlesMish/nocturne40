// Keep every existing query-based study URL. Only the empty entry opens the
// presentation; ?viewer=1 recalls the historical viewer without design options.
if (!location.search) {
  location.replace(new URL("./watch.html", location.href));
} else {
  void import("./main");
}
