const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Uncategorized",
        "Lifestyle",
        "Travel",
        "Food",
        "Photography",
        "Fashion",
        "Music",
        "Sports",
        "Business",
        "Technology",
        "Health",
        "Entertainment",
        "Education",
      ],
      message: "{VALUE is not supported}",
    },
    description: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    thumbnail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
