 const rulesData = {
  br: {
    icon: "🔥", title: "BR Match", badge: "Battle Royale",
    badgeColor: "bg-amber-100 text-amber-800", accentColor: "bg-amber-500",
    stats: [
      { label: "Mode", value: "Solo/Squad" },
      { label: "Map", value: "Bermuda/Kalahari" },
      { label: "Time Limit", value: "30 Min" },
    ],
    sections: [
      {
        title: "সাধারণ নিয়ম",
        items: [
          "ম্যাচ শুরুর আগে সব প্লেয়ার রুমে থাকতে হবে",
          "হ্যাক, চিট বা মড ব্যবহার করলে সরাসরি DQ",
          "ম্যাচ চলাকালীন রুম ছাড়লে হার গণ্য হবে",
          "স্ক্রিনশট বা ভিডিও প্রমাণ জমা দিতে হবে",
          "বিতর্কের ক্ষেত্রে হোস্টের সিদ্ধান্ত চূড়ান্ত",
        ],
      },
      {
        title: "পয়েন্ট সিস্টেম",
        items: [
          "Booyah (1st Place): ১০ পয়েন্ট",
          "2nd Place: ৬ পয়েন্ট, 3rd Place: ৪ পয়েন্ট",
          "প্রতিটি কিলের জন্য: ১ পয়েন্ট (সর্বোচ্চ ৫)",
          "টাই হলে মোট কিল দিয়ে বিজয়ী নির্ধারণ",
          "Disconnect হলে কোনো পয়েন্ট দেওয়া হবে না",
        ],
      },
      {
        title: "অতিরিক্ত নিয়ম",
        items: [
          "Zone camping অনুমোদিত নয়",
          "Match শুরুর ৫ মিনিট আগে room ID দেওয়া হবে",
          "Late join সর্বোচ্চ ২ মিনিট পর্যন্ত অনুমোদিত",
        ],
      },
    ],
  },
  cs4v4: {
    icon: "🎯", title: "CS 4v4", badge: "4 vs 4",
    badgeColor: "bg-blue-100 text-blue-800", accentColor: "bg-blue-500",
    stats: [
      { label: "Team Size", value: "4 + 4" },
      { label: "Map", value: "Bermuda" },
      { label: "Round", value: "Best of 3" },
    ],
    sections: [
      {
        title: "দলীয় নিয়ম",
        items: [
          "প্রতিটি দলে ঠিক ৪ জন প্লেয়ার থাকতে হবে",
          "ম্যাচ শুরুর আগে টিম লিস্ট কনফার্ম করতে হবে",
          "মাঝপথে প্লেয়ার পরিবর্তন করা যাবে না",
          "সাবস্টিটিউট শুধুমাত্র Disconnect-এর ক্ষেত্রে",
        ],
      },
      {
        title: "গেমপ্লে নিয়ম",
        items: [
          "Clash Squad মোডে খেলতে হবে",
          "প্রতি রাউন্ডে নির্দিষ্ট সময়ের মধ্যে শুরু করতে হবে",
          "Friendly fire থেকে বিরত থাকতে হবে",
          "গ্লিচ বা বাগ ব্যবহার করলে রাউন্ড বাতিল",
          "২ রাউন্ড জিতলেই ম্যাচ বিজয়ী",
        ],
      },
      {
        title: "পুরস্কার ও পয়েন্ট",
        items: [
          "বিজয়ী দল: ম্যাচ পয়েন্ট + প্রাইজ পুল",
          "MVP বোনাস পয়েন্ট আলাদাভাবে দেওয়া হবে",
          "প্রমাণ ছাড়া কোনো দাবি গ্রহণ করা হবে না",
        ],
      },
    ],
  },
  lonewolf: {
    icon: "🐺", title: "Lonewolf", badge: "Solo CS",
    badgeColor: "bg-purple-100 text-purple-800", accentColor: "bg-purple-500",
    stats: [
      { label: "Mode", value: "Solo" },
      { label: "Format", value: "Clash Squad" },
      { label: "Round", value: "BO3 / BO5" },
    ],
    sections: [
      {
        title: "সাধারণ নিয়ম",
        items: [
          "একক প্লেয়ার হিসেবে অংশগ্রহণ করতে হবে",
          "কোনো কো-অর্ডিনেশন বা callout নিষিদ্ধ",
          "আলাদা ভয়েস চ্যানেলে যোগ দেওয়া যাবে না",
          "প্রতিটি ম্যাচে রুম পাসওয়ার্ড ব্যবহার করতে হবে",
        ],
      },
      {
        title: "ম্যাচ ফরম্যাট",
        items: [
          "Best of 3 বা Best of 5, হোস্ট নির্ধারণ করবেন",
          "প্রতিটি রাউন্ডের স্ক্রিনশট জমা দিতে হবে",
          "Disconnect হলে ওই রাউন্ড পুনরায় খেলতে হবে",
          "টাই হলে Sudden Death রাউন্ড হবে",
        ],
      },
      {
        title: "ফেয়ার প্লে",
        items: [
          "অপরপক্ষকে ট্রোলিং বা হ্যারাসমেন্ট নিষিদ্ধ",
          "Emote abuse এবং delay tactics বন্ধ",
          "রিপোর্ট করা হলে রিপ্লে চেক করা হবে",
        ],
      },
    ],
  },
  cs2v2: {
    icon: "⚔️", title: "CS 2v2", badge: "2 vs 2",
    badgeColor: "bg-teal-100 text-teal-800", accentColor: "bg-teal-500",
    stats: [
      { label: "Team", value: "২ জন" },
      { label: "Map", value: "যেকোনো" },
      { label: "Format", value: "Best of 3" },
    ],
    sections: [
      {
        title: "দলীয় নিয়ম",
        items: [
          "প্রতিটি দলে ঠিক ২ জন প্লেয়ার থাকবে",
          "দুজনকেই একই রুমে থাকতে হবে",
          "ডুও ভয়েস চ্যাট ব্যবহার করা যাবে",
          "কোনো third party সাহায্য নেওয়া যাবে না",
        ],
      },
      {
        title: "গেমপ্লে নিয়ম",
        items: [
          "Clash Squad মোডে ২ vs ২ ফরম্যাটে খেলতে হবে",
          "প্রতিটি গেমের আগে ম্যাপ কনফার্ম করতে হবে",
          "রাউন্ড টাইম শেষ হলে সর্বোচ্চ HP টিম জিতবে",
          "একজন Disconnect হলে সেই রাউন্ড বাতিল হবে",
        ],
      },
      {
        title: "পুরস্কার",
        items: [
          "বিজয়ী দলকে পুরস্কার প্রদান করা হবে",
          "উভয় রাউন্ডের ফলাফল সহ স্ক্রিনশট পাঠাতে হবে",
          "ফলাফল ঘোষণার পর কোনো আপিল গৃহীত হবে না",
        ],
      },
    ],
  },
  survival: {
    icon: "🛡️", title: "BR Survival", badge: "Survival Mode",
    badgeColor: "bg-green-100 text-green-800", accentColor: "bg-green-500",
    stats: [
      { label: "Mode", value: "Solo BR" },
      { label: "Target", value: "Last 3 Alive" },
      { label: "Kill Pts", value: "+1 / Kill" },
    ],
    sections: [
      {
        title: "সারভাইভাল নিয়ম",
        items: [
          "শেষ পর্যন্ত বেঁচে থাকলে বিজয়ী হিসেবে গণ্য",
          "কিল পয়েন্ট বোনাস হিসেবে যোগ হবে",
          "Zone-এর বাইরে সময় নষ্ট করা নিষিদ্ধ",
          "নির্দিষ্ট Zone-এ ক্যাম্পিং পেনাল্টি আছে",
        ],
      },
      {
        title: "পয়েন্ট সিস্টেম",
        items: [
          "১ম স্থান (Booyah): ১৫ পয়েন্ট",
          "২য় স্থান: ১০ পয়েন্ট, ৩য় স্থান: ৭ পয়েন্ট",
          "প্রতিটি কিলের জন্য: ২ পয়েন্ট",
          "TOP 5 এ থাকলে অতিরিক্ত ৩ পয়েন্ট",
          "মোট পয়েন্টে সমান হলে বেশি কিলের প্লেয়ার জিতবে",
        ],
      },
      {
        title: "প্রমাণ ও যাচাই",
        items: [
          "ম্যাচ শেষে ফলাফলের স্ক্রিনশট বাধ্যতামূলক",
          "TOP 3 প্লেয়ারকে স্ক্রিন রেকর্ড জমা দিতে হবে",
          "Clip ছাড়া কিল claim গ্রহণ করা হবে না",
        ],
      },
    ],
  },
  free: {
    icon: "🎮", title: "Free Match", badge: "Custom Game",
    badgeColor: "bg-red-100 text-red-800", accentColor: "bg-red-500",
    stats: [
      { label: "Mode", value: "Custom" },
      { label: "Players", value: "যেকোনো" },
      { label: "Format", value: "হোস্ট নির্ধারিত" },
    ],
    sections: [
      {
        title: "সাধারণ নিয়ম",
        items: [
          "হোস্ট কর্তৃক ঘোষিত নিয়ম মানা বাধ্যতামূলক",
          "ম্যাচের আগে সব নিয়ম পড়ে কনফার্ম করতে হবে",
          "হ্যাক বা চিট ব্যবহার করলে তাৎক্ষণিক ban",
          "প্রতিটি ম্যাচের ফলাফল গ্রুপে পোস্ট করতে হবে",
        ],
      },
      {
        title: "বিশেষ শর্ত",
        items: [
          "হোস্ট যেকোনো মোড বা ফরম্যাট নির্ধারণ করতে পারবেন",
          "Entry fee থাকলে আগেই প্রদান করতে হবে",
          "রিফান্ড নীতি হোস্ট কর্তৃক নির্ধারিত",
          "বিতর্কের ক্ষেত্রে হোস্ট/অ্যাডমিনের সিদ্ধান্তই চূড়ান্ত",
        ],
      },
      {
        title: "আচরণবিধি",
        items: [
          "অশ্লীল ভাষা বা ব্যক্তিগত আক্রমণ নিষিদ্ধ",
          "Spam বা unsportsmanlike conduct-এ kick করা হবে",
          "সবার সাথে সম্মানজনক আচরণ করতে হবে",
        ],
      },
    ],
  },
};

export default rulesData;