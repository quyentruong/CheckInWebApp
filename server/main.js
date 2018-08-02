import {Meteor} from 'meteor/meteor';
import '../lib/collections';
import {CheckStatus, publicStatus} from "../lib/collections";

Meteor.publish('checkStatuses', function checkPublication() {
    return CheckStatus.find({
        $or: [
            {private: {$ne: true}},
            {owner: this.userId}
        ]
    });
});

Meteor.publish('publicStatuses', function checkPublication() {
    return publicStatus.find();
});

Meteor.methods({
    'publicStatuses.insert'(id, text, time) {
        const userPublic = publicStatus.find(
            {
                owner: Meteor.userId(),
                time: {$regex: time.split(" ")[0]}
            }, {sort: {createdAt: -1}}).fetch();
        if (userPublic.length === 0) {
            publicStatus.insert({
                text,
                time,
                createdAt: new Date(),
                owner: Meteor.userId(),
                username: Meteor.user().username
            });
        } else {
            publicStatus.update({
                owner: Meteor.userId(),
                time: {$regex: time.split(" ")[0]}
            }, {
                $set:
                    {
                        text: text,
                        time: time
                    }
            });
        }
    },
    'checkStatuses.insert'(id, text, time) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // CheckStatus.update(last, {$set: {private: true}});

        CheckStatus.insert({
            text,
            time,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username,
            // private: true
        });

    },

    'checkStatuses.remove'(id) {
        const todo = CheckStatus.findOne(id);
        if (todo.owner !== this.userId) {
            throw new Meteor.Error("Unauthorized");
        }
        CheckStatus.remove(id);

        const userPublic = CheckStatus.findOne({owner: todo.owner},
            {
                sort: {createdAt: -1},
                limit: 1
            });
        // console.log(userPublic);
        if (userPublic) {
            publicStatus.update({
                owner: todo.owner,
                time: {$regex: userPublic.time.split(" ")[0]}
            }, {
                $set:
                    {
                        text: userPublic.text,
                        time: userPublic.time
                    }
            });
        } else {
            publicStatus.remove({
                owner: todo.owner,
                time: {$regex: todo.time.split(" ")[0]}
            })
        }
    },

    'checkStatuses.setPublic'(id, setToPublic) {
        const todo = CheckStatus.findOne(id);
        if (todo.owner !== this.userId) {
            throw new Meteor.Error("Unauthorized");
        }
        CheckStatus.update(id, {$set: {private: setToPublic}});
    }

});