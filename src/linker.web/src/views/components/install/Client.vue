<template>
    <div>
        <el-form ref="formDom" :model="state.form" :rules="state.rules" label-width="14rem">
            <el-form-item label="" label-width="0">
                <el-row class="w-100">
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.device')" prop="name">
                            <el-input v-trim v-model="state.form.name" maxlength="32" show-word-limit />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form-item>
            <PcShow>
                <el-form-item label="" label-width="0">
                    <el-row class="w-100">
                        <el-col :sm="12" :xs="24">
                            <el-form-item :label="$t('install.mport')" prop="web">
                                <el-input v-trim  v-model="state.form.web" />
                            </el-form-item>
                        </el-col>
                        <el-col :sm="12" :xs="24">
                            <el-form-item :label="$t('install.mpwd')" prop="password">
                                <el-input v-trim  type="password" v-model="state.form.password" show-password maxlength="36" show-word-limit/>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form-item>
            </PcShow>
            
            <el-form-item label="" label-width="0">
                <el-row class="w-100">
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.group')" prop="groupid">
                            <el-input v-trim v-model="state.form.groupid" maxlength="36" show-word-limit />
                        </el-form-item>
                    </el-col>
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.gpwd')" prop="groupPassword">
                            <el-input v-trim v-model="state.form.groupPassword" type="password" show-password maxlength="36" show-word-limit />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form-item>
            <el-form-item label="" label-width="0">
                <el-row class="w-100">   
                    <el-col :span="24">
                        <el-form-item label-width="8rem" prop="hasServer">
                            <el-checkbox v-model="state.form.hasServer" :label="$t('install.has')" size="large" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form-item>

            <el-form-item label="" label-width="0" v-if="state.form.hasServer">
                <el-row class="w-100">
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.service')" prop="server">
                            <el-input v-trim v-model="state.form.server"/>
                        </el-form-item>
                    </el-col>
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.service1')" prop="server1">
                            <el-input v-trim v-model="state.form.server1"/>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form-item>
            
            <el-form-item label="" label-width="0" v-if="state.form.hasServer">
                <el-row class="w-100">
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.skey')" prop="superKey">
                            <el-input v-trim v-model="state.form.superKey" type="password" show-password maxlength="36" show-word-limit />
                        </el-form-item>
                    </el-col>
                    <el-col :sm="12" :xs="24">
                        <el-form-item :label="$t('install.spwd')" prop="superPassword">
                            <el-input v-trim v-model="state.form.superPassword" type="password" show-password maxlength="36" show-word-limit />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import { injectGlobalData } from '@/provide';
import { reactive,  watch, ref, inject, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
export default {
    setup(props) {

        const {t} = useI18n();
        const step = inject('step');
        const globalData = injectGlobalData();

        const state = reactive({
            form: {
                name:step.value.form.client.name || globalData.value.config.Client.Name,
                groupid: step.value.form.client.groupid ||globalData.value.config.Client.Group.Id,
                groupPassword: step.value.form.client.groupPassword ||globalData.value.config.Client.Group.Password,
                web: step.value.form.client.web ||globalData.value.config.Client.CApi.WebPort,
                password:step.value.form.client.password || globalData.value.config.Client.CApi.ApiPassword,

                hasServer:step.value.form.client.hasServer ||false,
                server:step.value.form.client.server ||globalData.value.config.Client.Server.Host,
                server1:step.value.form.client.server1 ||globalData.value.config.Client.Server.Host1,
                superKey:step.value.form.client.superKey ||globalData.value.config.Client.Server.SuperKey,
                superPassword:step.value.form.client.superPassword ||globalData.value.config.Client.Server.SuperPassword
            },
            rules: {
                name: [{ required: true, message: t('install.required'), trigger: "blur" }],
                groupid: [{ required: true, message: t('install.required'), trigger: "blur" }],
                groupPassword: [{ required: true, message: t('install.required'), trigger: "blur" }],
                password: [{ required: true, message: t('install.required'), trigger: "blur" }],
                web: [
                    { required: true, message: t('install.required'), trigger: "blur" },
                    {
                        type: "number",
                        min: 0,
                        max: 65535,
                        message: "0-65535",
                        trigger: "blur",
                        transform(value) {
                            return Number(value);
                        },
                    },
                ],
            }
        });
        const formDom = ref(null);
        const handleValidate = () => {
            return new Promise((resolve, reject) => {
                formDom.value.validate((valid) => {
                    if (valid) {
                        resolve({
                            json:{
                                Client:{
                                    name: state.form.name,
                                    groupid: state.form.groupid,
                                    groupPassword: state.form.groupPassword,
                                    web: +state.form.web,
                                    password: state.form.password,

                                    hasServer: state.form.hasServer,
                                    server: state.form.server,
                                    server1: state.form.server1,
                                    superKey: state.form.superKey,
                                    superPassword: state.form.superPassword
                                }
                            },
                            form:{
                                client:JSON.parse(JSON.stringify(state.form))
                            }
                        });
                    } else {
                        reject();
                    }
                })
            })
        }
        onMounted(()=>{
            if(step.value.json.Common.client == false){
                step.value.step +=step.value.increment;
            }
        })

        return { state,handleValidate, formDom };
    }
}
</script>
<style lang="stylus" scoped>
.body{
    padding:1rem 0 0 0;
}
.footer{
    padding: 1rem 0;
}
.phone .el-dialog__body .el-col .el-form-item:last-child {margin-bottom:.6rem}
</style>