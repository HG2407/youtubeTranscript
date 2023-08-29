const express = require('express');
const {YoutubeTranscript} = require('youtube-transcript');
const {ChatOpenAI} = require('langchain/chat_models/openai');
const {HNSWLib} = require('langchain/vectorstores/hnswlib');
const {OpenAIEmbeddings} = require('langchain/embeddings/openai');
const {CharacterTextSplitter} = require('langchain/text_splitter');
const {ConversationalRetrievalQAChain} = require('langchain/chains');
const {ChatMessage} = require('langchain/schema');
const app = express();
require('dotenv').config();

app.use(express.json());

app.use(express.static(path.join(__dirname, './dist')));

let chain;
let chatHistory = [];

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname,'./dist/index.html'));
})

async function initializeChain(initialPrompt, transcript) {
    let model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.9
    });

    let splitter = new CharacterTextSplitter({
        separator: ' ',
        chunkSize: 7,
        chunkOverlap:3
    });

    //create smaller documents from a big document, in this case transcript
    let docs = await splitter.createDocuments([transcript]);


    //COPIED
    // // Just to show you, we'll also save the vector store as a file in case you want to retrieve it later.
    //     // We'll copy our root directory and save it as a variable
    //     const directory = "/Users/shawnesquivel/GitHub/yt-script-generator/";
    //     await vectorStore.save(directory);
    //     //  it will create some files for us, including a way for us to view the vector store documents which is helpful.
    //     // then you can access it like this:
    //     const loadedVectorStore = await HNSWLib.load(
    //       directory,
    //       new OpenAIEmbeddings()
    //     );


    let vectorStore = await HNSWLib.fromDocuments(
        [{pageContent: transcript}],
        new OpenAIEmbeddings({openAIApiKey: process.env.OPENAI_API_KEY})    
    );

    chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever(),
        {verbose: true}
    );

    let response = await chain.call({
        question: initialPrompt,
        chat_history: chatHistory
    });

    chatHistory.push(new ChatMessage(response.text, 'assistant'));
    
    return response;
}


app.post('/input', async (req, res) => {
    let input = req.body.input

    // step 1 = if it is the first message then fetch the transcript of the video and pass the transcript to the initializeChain function
    if(req.body.firstMsg) {
        console.log('here');
        let initialPrompt = `Give me the summary of the transcript: ${input}`;
        chatHistory.push(new ChatMessage(initialPrompt, 'user'));

        let videoTranscript = await YoutubeTranscript.fetchTranscript(input);
        let transcript = '';
        videoTranscript.forEach((line) => {
            transcript += line.text + ' ';
        });
        
        console.log(transcript);
        let response = await initializeChain(initialPrompt, transcript);
        res.json(response);
    } else {
        chatHistory.push(new ChatMessage(input, 'user'));

        let response = await chain.call(new ChatMessage(input, 'user'));
        res.json(response);
    }
});


app.listen(8000, () => {
    console.log('server is listening at port: 8000');
});