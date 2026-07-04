<template>
    <div class="t-c">
        <el-checkbox v-model="state.form.client" :label="$t('install.client')" />
        <PcShow>
            <el-checkbox v-model="state.form.server" :label="$t('install.server')"/>
        </PcShow>
    </div>
</template>

<script>
import {inject, reactive} from 'vue'
import { injectGlobalData } from '@/provide';
export default {
    name: 'Common',
    setup () {
        const globalData = injectGlobalData();
        const step = inject('step');
        const state =  reactive({
            form: {
                client:step.value.form.common.client ||  (step.value.json.Common && step.value.json.Common.client) || true,
                server:step.value.form.common.server ||  (step.value.json.Common && step.value.json.Common.server) || false,
            }
        });
        const handleValidate = (prevJson) => {
            return new Promise((resolve, reject) => {
                if(!state.form.client && !state.form.server){
                    reject();
                }else{
                    resolve({
                        json:{
                            Common:{
                                client: state.form.client,
                                server: state.form.server,
                                modes:[
                                state.form.client ? 'client' : '',
                                state.form.server ? 'server' : ''
                                ].filter(c=>!!c)
                            }
                        },
                        form:{common:JSON.parse(JSON.stringify(state.form))}
                    });
                }
            });
        }


        return {
            state,globalData,handleValidate
        }
    }
}
</script>

<style lang="stylus" scoped>

</style>