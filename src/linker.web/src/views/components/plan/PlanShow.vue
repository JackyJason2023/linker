<template>
    <a href="javascript:;" class="a-line" @click="handleEdit">
        <span v-if="item">{{ rule }}</span>
        <span v-else>{{$t('plan.unset')}}</span>
    </a>
</template>

<script>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    props: ['keyid','handle'],
    setup (props) {
        
        const {t} = useI18n();
        const regex = /(\d+|\*)-(\d+|\*)-(\d+|\*)\s+(\d+|\*):(\d+|\*):(\d+|\*)/;
        const regexNumber = /(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+)/;
        const ruleTrans = {
            0:()=>t('plan.manual'),
            1:()=>t('plan.setup'),
            2:(item,rule)=>{
                if(regex.test(rule) == false){
                    return rule;
                }
                const [,year,month,day,hour,minute,second] = rule.match(regex);
                if(minute == '*') return `${t('plan.anymm')}${second}${t('plan.s')}`;
                if(hour == '*') return `${t('plan.anyh')}${minute}${t('plan.mm')}${second}${t('plan.s')}`;
                if(day == '*') return `${t('plan.anyd')}${hour}${t('plan.h')}${minute}${t('plan.mm')}${second}${t('plan.s')}`;
                if(month == '*') return `${t('plan.anym')}${day}${t('plan.d')}${hour}${t('plan.h')}${minute}${t('plan.mm')}${second}${t('plan.s')}`;
                if(year == '*') return `${t('plan.anyy')}${month}${t('plan.m')}${day}${t('plan.d')}${hour}${t('plan.h')}${minute}${t('plan.mm')}${second}${t('plan.s')}`;
            },
            4:(item,rule)=>{
                if(regexNumber.test(rule) == false){
                    return rule;
                }
                const [,year,month,day,hour,minute,second] = rule.match(regexNumber);
                const arr = [];
                if(year != '0') arr.push(`${year}${t('plan.y')}`);
                if(month != '0') arr.push(`${month}${t('plan.m')}`);
                if(day != '0') arr.push(`${day}${t('plan.d')}`);
                if(hour != '0') arr.push(`${hour}${t('plan.h')}`);
                if(minute != '0') arr.push(`${minute}${t('plan.mm')}`);
                if(second != '0') arr.push(`${second}${t('plan.s')}`);
                return `${t('plan.any')}${arr.join('')}`
            },
            8:(item,rule)=>{
                return `Cron : ${rule}`;
            },
            16:(item,rule)=>{
                if(regexNumber.test(rule) == false){
                    return rule;
                }
                const [,year,month,day,hour,minute,second] = rule.match(regexNumber);
                const arr = [];
                if(year != '0') arr.push(`${year}${t('plan.y')}`);
                if(month != '0') arr.push(`${month}${t('plan.m')}`);
                if(day != '0') arr.push(`${day}${t('plan.d')}`);
                if(hour != '0') arr.push(`${hour}${t('plan.h')}`);
                if(minute != '0') arr.push(`${minute}${t('plan.mm')}`);
                if(second != '0') arr.push(`${second}${t('plan.s')}`);
                return `${t('plan.on')}【${plan.value.handleJson[item.TriggerHandle]}】${arr.join('')}${t('plan.after')}`
            },
        }

        const plan = inject('plan');
        const item = computed(()=>plan.value.list[`${props.keyid}-${props.handle}`]);
        const rule = computed(()=>{
            if(!item.value) return '';
            const method = item.value.Method;
            if(ruleTrans[method]){
                return ruleTrans[method](item.value,item.value.Rule);
            }
            return item.value.Rule;
        });
        const handleEdit = () => {
            plan.value.current = item.value || {
                Id:0,
                Category:plan.value.category,
                Key:`${props.keyid}`,
                Handle:props.handle,
                Value:'',
                Disabled:false,
                TriggerHandle:'',
                Method:2,
                Rule:''
            };
            plan.value.triggers = JSON.parse(JSON.stringify(plan.value.handles.filter(c=>c.value != props.handle)));
            plan.value.showEdit = true;
        }

        return {item,rule,handleEdit}
    }
}
</script>

<style lang="stylus" scoped>

</style>