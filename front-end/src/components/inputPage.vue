<template>
    <div class="container">
        <div class="chatBox" ref="chatBox">
            <p v-for="number in storedMessage.length" :key="number">{{ storedMessage[number-1] }}</p>
        </div>
        <p v-if="wait" class="wait">Please Wait...</p>
        <input type="text" v-model="userInput" @keydown.enter="send" style="height: 2rem; width: 100%;" placeholder="please enter a Youtube URL" v-if="firstMsg">
        <input type="text" v-model="userInput" @keydown.enter="send" style="height: 2rem; width: 100%;" placeholder="ask a question" v-else>
    </div>
</template>


<script>
import axios from 'axios';
    export default{
        name: 'Input_Page',
        data() {
            return {
                userInput: '',
                storedMessage: [],
                enterClicked: false,
                firstMsg: true,
                wait: false
            }
        },

        methods: {
            async send() {
                let response;
                if(!this.enterClicked) {
                    this.wait = true;
                    this.enterClicked = true;
                    this.storedMessage.push(this.userInput);
                    this.$nextTick(() => {
                        this.$refs['chatBox'].scrollTop = this.$refs['chatBox'].scrollHeight;
                    });
                    this.userInput = '';
                    if(this.firstMsg) {
                        response = await axios.post('/input', {
                            input: this.storedMessage[this.storedMessage.length-1],
                            firstMsg: true
                        });
                        this.firstMsg = false;
                    } else {
                        response = await axios.post('/input', {
                            input: this.storedMessage[this.storedMessage.length-1]
                        });
                    }
                    this.storedMessage.push(response.data.text);
                    this.wait = false;
                    this.$nextTick(() => {
                        this.$refs['chatBox'].scrollTop = this.$refs['chatBox'].scrollHeight;
                    });
                    this.enterClicked = false;
                }
                
            }
        }
    }
</script>

<style>
    .container {
        width: 25rem;
        height: 35rem;
        display: inline-block;
        position: relative;
    }

    .chatBox{
        width: 100%;
        height: 33rem;
        border: 0.1rem solid black;
        overflow-y: scroll;
        background-color: gainsboro;
    }

    ::-webkit-scrollbar {
        width: 0;
    } 

    .wait {
        position: absolute;
        bottom: 3%;
        right: 40%;
    }

    .chatBox p {
        text-align: left;
        padding: 0.5rem;
        padding-left: 1.5rem;
    }
</style>