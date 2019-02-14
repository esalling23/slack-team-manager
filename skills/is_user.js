module.exports = function(controller) {
  
  controller.isUser = function(member, includeThisBot) {
    return member.is_bot || (member.name == process.env.botName && !includeThisBot) || member.name == "slackbot" ? false : true;
  }
  
  controller.ignoreEmails = [
    "esalling23@gmail.com", 
    "erica.salling@gmail.com", 
    "erica@elab.emerson.edu",
    "testingthebots@gmail.com", 
    
    "wadek2@gmail.com", 
    "sam@extraludic.com"
  ]
  
}