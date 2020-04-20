function createIcon(title, widthMultiplier = 1, heightMultiplier = 1) {
  return {
    props: {
      size: {
        default: 14,
        type: Number,
      },
      title: {
        default: title,
        type: String,
      }
    },
    computed: {
      height: function() { return this.size * heightMultiplier; },
      width: function() { return this.size * widthMultiplier; }
    }
  }
}

export default createIcon;
