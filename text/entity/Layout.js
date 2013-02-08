define(["js/data/Entity"], function (Entity) {

    return Entity.inherit('text.entity.Layout', {
        defaults: {
            width: null,
            height: null
        }
    });

});