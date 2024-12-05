var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CodeSchema = new Schema({
  codeName: {
    type: String,
  }
});


mongoose.model('Code', CodeSchema, "code");