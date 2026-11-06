// Reusable URL field: empty or must start with http:// or https://
exports.urlField = () => ({
  type: String,
  trim: true,
  default: '',
  maxlength: 300,
  validate: {
    validator: (v) => !v || /^https?:\/\/\S+$/i.test(v),
    message: 'Links must start with http:// or https://',
  },
});