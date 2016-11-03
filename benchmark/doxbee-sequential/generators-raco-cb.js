global.useNative = true;

try {
    if (Promise.race.toString() !== 'function race() { [native code] }')
        throw 0;
} catch (e) {
    throw new Error("No ES6 promises available");
}
var raco = require("raco");
require('../lib/fakesP');

module.exports = raco.wrap(function * (stream, idOrPath, tag, done) {
    try {
        var blob = blobManager.create(account);
        var tx = db.begin();
        var blobId = yield blob.put(stream, done);
        var file = yield self.byUuidOrPath(idOrPath).get(done);

        var previousId = file ? file.version : null;
        version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        yield Version.insert(version).execWithin(tx, done);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            file = {
                id: uuid.v1(),
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }
            var query = yield self.createQuery(idOrPath, file, done);
            yield query.execWithin(tx, done);
        }
        yield FileVersion.insert({fileId: file.id, versionId: version.id})
            .execWithin(tx, done);
        yield File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx, done);
        yield tx.commit(done);
        done();
    } catch (err) {
        yield tx.rollback(done);
        done(err);
    }
});
