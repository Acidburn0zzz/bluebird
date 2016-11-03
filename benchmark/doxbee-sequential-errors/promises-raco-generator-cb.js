global.useraco = true;
global.useQ = false;
var raco = require('raco');
require('../lib/fakesP');

module.exports = raco.wrap(function* upload(stream, idOrPath, tag, done) {
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
        triggerIntentionalError();
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
            triggerIntentionalError();
        }
        yield FileVersion.insert({fileId: file.id, versionId: version.id})
            .execWithin(tx, done);
        triggerIntentionalError();
        yield File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx, done);
        triggerIntentionalError();
        tx.commit();
        done();
    } catch (err) {
        tx.rollback();
        done(err);
    }
});
