try {
  rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "mongo-db:27017" }]
  });
} catch (e) {
  print(e);
  rs.reconfig({
    _id: "rs0",
    members: [{ _id: 0, host: "mongo-db:27017" }]
  }, { force: true });
}
