db.createCollection("tmp")
db.tmp.insert({"key":"value"})
db.createUser(
  {
    user: "miscela",
    pwd: "password",
    roles: [
      {
        role: "readWrite",
        db: "miscela"
      },
      {
        role: "readWriteAnyDatabase",
        db: "admin"
      }
    ]
  }
)
