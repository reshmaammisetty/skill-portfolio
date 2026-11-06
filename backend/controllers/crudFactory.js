const { asyncHandler, httpError, logActivity } = require('../utils/helpers');

// Builds list/get/create/update/remove handlers for any model owned by a user.
// Every query is filtered by req.user._id, so users can only touch their own data.
module.exports = function crudFactory({
  Model,
  label,
  titleField = 'title',
  fields,
  sort = { createdAt: -1 },
  beforeSave,
  afterSave,
  describeUpdate,
}) {
  const pick = (body) =>
    fields.reduce((o, f) => {
      if (body[f] !== undefined) o[f] = body[f];
      return o;
    }, {});

  const findOwned = async (req) => {
    const doc = await Model.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) throw httpError(404, `${label} not found`);
    return doc;
  };

  return {
    list: asyncHandler(async (req, res) => {
      res.json(await Model.find({ user: req.user._id }).sort(sort));
    }),

    get: asyncHandler(async (req, res) => {
      res.json(await findOwned(req));
    }),

    create: asyncHandler(async (req, res) => {
      const doc = new Model({ ...pick(req.body), user: req.user._id });
      if (beforeSave) beforeSave(doc);
      await doc.save();
      if (afterSave) await afterSave(doc, null, req.user);
      await logActivity(req.user._id, label, `Added ${label}: ${doc[titleField]}`);
      res.status(201).json(doc);
    }),

    update: asyncHandler(async (req, res) => {
      const doc = await findOwned(req);
      const before = doc.toObject();
      doc.set(pick(req.body));
      if (beforeSave) beforeSave(doc);
      await doc.save();
      if (afterSave) await afterSave(doc, before, req.user);
      const msg = describeUpdate ? describeUpdate(doc, before) : `Updated ${label}: ${doc[titleField]}`;
      if (msg) await logActivity(req.user._id, label, msg);
      res.json(doc);
    }),

    remove: asyncHandler(async (req, res) => {
      const doc = await Model.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!doc) throw httpError(404, `${label} not found`);
      await logActivity(req.user._id, label, `Deleted ${label}: ${doc[titleField]}`);
      res.json({ message: `${label} deleted` });
    }),
  };
};