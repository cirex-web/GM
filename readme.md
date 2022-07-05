# Clock it! - The Google Meet Participation Tracker 
Screenshots coming soon... download to try it out! :)
Made by: Eric Xu


General Description:
===
This extension tracks student participation by looking at how much each person talks for in a single class. 

Noteworthy Features
===
  View a live dashboard of your current meeting.
Categorize your meetings by class. 
View and manage past meetings 
Analyze speaking data by class and view trends over time.


Difficulty
===
To make the features you saw possible, I examined Google Meet's obfuscated source code (using "inspect element" and a whole lot of breakpoints) and examined how the UI elements were generated and updated. Using function injection along with accessing DOM elements, I could obtain this internal data and generate the speaking times. This could've only been done with a top-level script, which complicated data passing as well. 

Originality
===
The main reason I undertook this project was that I was curious about how much my classmates participated in class. Thanks to online learning, that metric now became speaking time, which was quantifiable. However, there was no way of getting speaking data in Google Meet. There was no built in-feature, no Chrome Extensions, and no indication that anyone was even trying to build it. This extension may very well be the first of its kind.

Polish
===
For the UI, I went for a minimalist theme with a color palette of primarily black and white (I just tried to keep it as clean as possible.)

Theme
===
  Make it easier for you to track participation in class! See how much your classmates are talking in class and examine patterns in their activity. (ex. which classes they like to talk more in)

Other Use Examples
===
Teachers no longer have to keep track of who has already been called on in class; a quick glance will do.
Gain unexpected insights into the talking patterns of students and teachers
Prevent a student from dominating the conversation
Encourages quieter students to participate


# Some screenshots:

### Current meeting page
<img width="363" alt="Screen Shot 2022-07-05 at 3 53 14 PM" src="https://user-images.githubusercontent.com/57322506/177396590-85445e0e-300d-481b-ac89-068638caa7ff.png">

### Meeting history page
<img width="359" alt="Screen Shot 2022-07-05 at 3 52 57 PM" src="https://user-images.githubusercontent.com/57322506/177396777-784123c2-7a7d-4e48-b3f6-b318d21fa8c0.png">
<img width="361" alt="Screen Shot 2022-07-05 at 3 52 41 PM" src="https://user-images.githubusercontent.com/57322506/177396681-f4ef5f47-9735-4c50-911e-0f1089a2c115.png">


### Analysis section
<img width="360" alt="Screen Shot 2022-07-05 at 3 53 33 PM" src="https://user-images.githubusercontent.com/57322506/177396730-7cb3b536-d700-4554-8b95-b31088917a6b.png">
<img width="357" alt="Screen Shot 2022-07-05 at 3 53 47 PM" src="https://user-images.githubusercontent.com/57322506/177396827-2aa26e52-9674-4f4f-83ed-bc8efcb13c0f.png">


