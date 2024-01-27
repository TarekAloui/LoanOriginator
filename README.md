# LoanOriginator
An LLM-powered full-stack project for extracting transaction data from bank statements and deciding whether or not to provide a loan based on a knn classifier.

## Features Overview:
- Automatically parsing transaction lists from different forms of bank statements
- Automatically predicting the transaction categories (eg. Deposit, Rent/ Mortgage payment...)
- Automatically detecting some metadata (bank name, country code, statement year)
- Providing monthly summaries (deposits, withdrawals and expenses per category)
- Automatically generating a loan decision based on previously-fed examples of bank statements and loan decisions. The training data updates when the person checking the results looks through the data and decides they agree with the loan decision given by the algorithm. This adds a new datapoint to the training data.

## Demo and Functionality Overview:

### Step 1: User uploads a bank statement pdf
![Demo Step 1](/images/demo_step_1.png)
User initiates the process by uploading a bank statement in PDF format. This file is then securely uploaded to Google Cloud Storage.

### Step 2: Backend processing
![Demo Step 2](/images/demo_step_2.png)
Once the PDF is uploaded, a request is sent to the backend where the processing begins. This involves running an LLM to extract and format the transactions list.

### Step 3: Extracting Transactions and Metadata
![Demo Step 3](/images/demo_step_3.png)
The backend extracts the transactions list in a predictable format and predicts each transaction's category. It also extracts general metadata like the bank name, country code, and statement year.

### Step 4: Summary Metrics and Loan Decision
![Demo Step 4](/images/demo_step_4.png)
Summary metrics are calculated and fed to another LLM to generate reasons for and against providing a loan. The backend then uses these metrics to provide a Loan/No Loan classification using a KNN algorithm.

### Step 5: Frontend Dashboard Display
![Demo Step 5](/images/demo_step_5.png)
The frontend displays the metrics, loan decision, and the reasons for and against the decision. It provides a dashboard-like UI with an overview of deposits, withdrawals, and expenses in various categories. The frontend also allows toggling the full list of transactions.

### Step 6: Confirming the Decision
![Demo Step 6](/images/demo_step_6.png)
The final step involves the agent confirming the loan decision by clicking the "Confirm Decision" button. This action sends a message to the backend, adding the current statement analysis to the training data. This button is strategically placed at the bottom, encouraging agents to first review the analysis and transaction list before making a final decision.

Additionally, the user has the option to quickly view the uploaded PDF, securely hosted on Google Cloud. Each time the "View Statement" button is clicked, a new publicly available URL is generated with a certain expiration date.


## Tech Stack Overview:
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

![Deployment Loading](/images/deployment-loading.png)

  - The backend was containerized using Docker and the image is hosted on Dockerhub
  - The backend was deployed on Google Cloud Run, which allows for
    - Serverless deployment with ability to autoscale (up or down)
    - Cost-effective (I don't have to pay for long idle hours where the backend is not being used)
    - Manage traffic between deployments (eg. for A/B testing features or rolling back in case of failure)
    - Perform continuous deployment with every push to the main branch of the repository (the GCS Build services listens to the repository and builds the docker image on every push to the main branch. It also keeps track of revisions)
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