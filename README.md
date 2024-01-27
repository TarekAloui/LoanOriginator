# LoanOriginator
An LLM-powered full-stack project for extracting transaction data from bank statements and deciding whether or not to provide a loan based on a knn classifier.

## Features Overview:
- Automatically parsing transaction lists from different forms of bank statements
- Automatically predicting the transaction categories (eg. Deposit, Rent/ Mortgage payment...)
- Automatically detects some metadata (bank name, country code, statement year)
- Provides monthly summaries (deposits, withdrawals and expenses per category)
- Automatically generates a loan decision based on previously-fed examples of bank statements and loan decisions, the training data updates when the person checking the results looks through the data and decides they agree with the loan decision given by the algorithm. This adds a new datapoint to the training data

## Functionality Overview:
- User uploads a bank statement pdf
- The pdf gets uploaded to Google Cloud Storage and then a request is sent to the backend.
- The backend runs an LLM to extract the transactions list in a predictable format. The LLM also tries to predict each transaction's category from a preset list of categories using the transaction description
- The backend also extracts general metadata such as the bank name, country code and statement year
- The backend calculates some summary metrics which are then fed to another LLM to generate reason for and reasons against providing a loan
- The backend uses the metrics to provide a Loan/ No Loan classification using a simple KNN algorithm (the training data gets regularly updated by user as explained later)
- The frontend receives the metrics, loan decision, reasons for giving the loan and reasons against and provides the information in a dashboard-like UI with Monthly overview of deposits, withdrawals and some expenses (utility, loan payments, rent/ mortgage)
- The frontend also gives the option to show the full list of transactions if needed
- At the bottom of the results page is a "Confirm Decision" button that would be clicked by an agent that agrees with the loan decision and the extracted statement analysis. So a new datapoint is added to the training data to inform future decisions
- The user can also quickly view the uploaded pdf, which is securely hosted on the Google Cloud. Each time "View Statement" button is clicked, a new publicly available url is generated with a certain expiration date. The button was intentionally-placed in the bottom to make sure the agent first reviews the analysis and transaction list before making a final decision.

## Tech Stack overview:
### Backend:
  - The backend was built using FastAPI / Python
  - Langchain was used to create LLM chains and run GPT models on the given prompts and prompt templates
  - Pandas was used to tabulate the transactions extracted by the LLM and calculate the summary statistics
  - Scikit-Learn was used to train the KNN classifier and run the inference on new datapoints

### Frontend:
  - The frontend uses Next.js with Typescript and TailwindCSS.
    - Next.js cache was used to save the backend responses temporarily to reduce the number of API calls to the backend
    - Server Actions were used to make sure API calls (to GCS cloud storage for instance) happen in the server side to reduce risk of sharing API keys accidently
  - Tremor library was used for visualizations
  - MUI library was used for displaying the transactions table
  - LDRS library was used for the cool spinning helix loader

### Database
  - Google Cloud Firestore (Document-based) database was used for saving the new statement analyses and the training data for the KNN as it gets updated
### Storage:
  - Google Cloud Storage was used for uploading statement pdfs and sharing secure publicly-available urls

### Deployment
  - The backend was containerized using Docker and the image is hosted on Dockerhub
  - The backend was deployed on Google Cloud Run, which allows for
    - Serverless deployment with ability to autoscale (up or down)
    - Cost-effective (I don't have to pay for long idle hours where the backend is not being used)
    - Manage traffic between deployments
    - Perform continuous deployment with every push to the main branch of the repository (the GCS Build services is listening to the repository and build the docker image on every push to the main branch. It also keeps track of revisions)
  - The frontend was deployed using Vercel, which also allows for continuous deployment by listening to changes in the main branch

### LLMs:
  - gpt-4-1106-preview was used for the transaction parsing and providing reasons for and against providing a loan
  - gpt-3.5-turbo was used for extracting the statement metadata

## Discussion, Limitations, Future Work

### Supporting a wide range of formats

- I have downloaded a list of 28 statements and tested the backend statement analysis on them. In a previous code version, only 11 out of the 28 statements were fully parsed and analyzed properly (not checked for hallucinations though). A newer code version handles additional edge-cases in the transaction formatting so more of the statements are able to run. However, some statement formats are just hard to parse (eg. when there is no transaction list at all or when the deposits/withdrawals are not easily distinguished from the table).

- I have tried to support different international statement formats (for instance by intentionally standardizing the date format in the LLM prompt to support for eg. DD-MM-YYYY which is more used in some francophone countries like Canada or France)

### Hallucinations, Inaccuracies
- The solution relies entirely on the zero-shot capabilities of Large Language Models (i.e being able to perform an unseen task without providing examples of how to do it). So I have not had the time to perform any finetuning whatsoever. While the parsing results are decent given this is an MVP, in a production setting, we need better Transaction Category prediction by providing some examples to the LLM (from training statements, with the transactions' correct categories). The amounts parsed were not thoroughly checked but they seemed good enough for most of the statements I looked at. This leaves a big room for possible hallucinations and inaccurate parsing which requires better prompting, and potentially a better feedback system (where statement analyses can also be changed by agents at a granular level instead of just agreeing or not agreeing). The feedback could be used to improve the prompts and potentially fine-tune a better model.

### Loan/ No Loan Classification Considerations
- The current solution uses simple KNN classification for two reasons:
  - Simpler model = potentially easier explainability which could be important to customers (individuals requesting a loan) or agents (individuals reviewing the decision and approving it)
  - Ability to showcase a potential for improving the decision-making based on feedback from knowledgeable agents
- The model does not however take into account certain external factors which could be very crucial in making a loan decision
  - Eg. interest rates, average salary in the country the statement was issued..
  - Finding these factors requires feedback from experienced loan officers and bankers
  

### Better User Experience, Authentication
- The frontend and user experience is still lacking. Currently, I am combining the view a customer would see with the view the agent would see. Ideally, there would be authentication in place with different experiences for both types of users
- The frontend theme and visual design was rushed and could get better (better choice of color combinations and themes)
- The frontend does not fully use the power of server-rendering offered by Next.js