/* =====================================
   BIẾN TOÀN CỤC
===================================== */

export const state = {
    questions: [],
    selectedQuestions: [],
    currentQuestion: 0,

    notLearnedQuestions: [],
    searchResults: [],

    searchKeyword: "",
    searchSubject: "",
    returnToSearch: false,

    answeredState: {},

    currentUser: null,
    isGuest: false,
};