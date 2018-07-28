import {Meteor} from 'meteor/meteor';
import '../lib/collections';
import {CheckStatus} from "../lib/collections";

Meteor.publish('checkStatuses', function checkPublication() {
    return CheckStatus.find({
        $or: [
            {private: {$ne: true}},
            {owner: this.userId}
        ]
    });
});

Meteor.methods({
    'checkStatuses.insert'(id, text, time, last) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        CheckStatus.update(last, {$set: {private: true}});

        CheckStatus.insert({
            text,
            time,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username,
            private: true
        });

    },

    'checkStatuses.remove'(id) {
        const todo = CheckStatus.findOne(id);
        if (todo.owner !== this.userId) {
            throw new Meteor.Error("Unauthorized");
        }
        CheckStatus.remove(id);
    },

    'checkStatuses.setPublic'(id, setToPublic) {
        const todo = CheckStatus.findOne(id);
        if (todo.owner !== this.userId) {
            throw new Meteor.Error("Unauthorized");
        }
        CheckStatus.update(id, {$set: {private: setToPublic}});
    }

});