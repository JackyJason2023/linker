import { getSignInList } from "@/apis/signin";
import { injectGlobalData } from "@/provide";
import { computed, inject, nextTick, provide, reactive, ref } from "vue";

const deviceSymbol = Symbol();
export const provideDevices = () => {
    //https://api.ipbase.com/v1/json/8.8.8.8
    const globalData = injectGlobalData();
    const machineId = computed(() => globalData.value.config.Client.Id);
    const hasFullList = computed(() => globalData.value.hasAccess('FullList'));

    const ps = +(localStorage.getItem('ps') || '255');
    const count = +(localStorage.getItem('device-count') || '255');
    const prop = localStorage.getItem('prop') || '';
    const asc =  (localStorage.getItem('asc') || 'false') == 'true';
    const name = localStorage.getItem('search-name');
    
    const devices = reactive({
        timer: 0,
        timer1: 0,
        page: {
            Request: {
                Page: 1, Size: ps, Name: name, Ids: [], Asc: asc, Prop: prop
            },
            Count: count,
            List: Array(count).fill().map(c=>{ return {}}),
            _list:[]
        },
        loadTimer:0,

        showDeviceEdit: false,
        showAccessEdit: false,
        deviceInfo: null
    });
    provide(deviceSymbol, devices);

    const hooks = {};
    const deviceAddHook = (name,dataFn,processFn,refreshFn) => {
        hooks[name] = {dataFn,processFn,refreshFn,changed:true,refresh:true};
    }
    const deviceRefreshHook = (name) => {
        if(hooks[name]) {
            hooks[name].refresh = true;
            hooks[name].changed = true;
        }
    }
    const startHooks = () => { 

        const dataFn = (hook)=>{
            return new Promise((resolve, reject) => { 
                hook.dataFn(devices.page.List.filter(c=>c)).then(changed=>{
                    hook.changed = hook.changed ||changed;
                    resolve();
                });
            });
        }
        const fn = async ()=>{
            clearTimeout(devices.timer1);

            const refreshs = Object.values(hooks).filter(c=>c.refresh);
            refreshs.forEach(hook=>{ 
                hook.refresh = false;
                hook.refreshFn(devices.page.List);
            });
            await Promise.all(Object.values(hooks).map(hook=>dataFn(hook)));
            

            const changeds = Object.values(hooks).filter(c=>c.changed);
            changeds.forEach(hook=>{ hook.changed=false });
            if(changeds.length > 0){
                for (let i = 0; i< devices.page.List.length; i++) {
                    const device = devices.page.List[i];
                    if(device){
                        const json = {_index:i};
                        for(let j = 0; j < changeds.length; j++) {
                            const hook = changeds[j];
                            hook.processFn(device,json);
                        }
                        Object.assign(device, json);
                    }
                }
                _handleSort();
            }
           
            devices.timer1 = setTimeout(fn,1000);
        }
        fn();
    }

    const deviceStartProcess = () => { 
        _getSignList().then(()=>{
            setTimeout(startHooks,100);
            _getSignList1();
        });
    }

    const _getSignList = () => {
        return new Promise((resolve, reject) => { 
            getSignInList(devices.page.Request).then((res) => {
                
                if(!hasFullList.value)
                {
                    res.List = res.List.filter(c=>c.MachineId == machineId.value);
                    res.Count = 1;
                }
                
                for (let j in res.List) {
                    const item = res.List[j];
                    Object.assign(item, {
                        showDel: machineId.value != item.MachineId && item.Connected == false,
                        showAccess: machineId.value != item.MachineId && item.Connected,
                        showReboot: item.Connected,
                        isSelf: machineId.value == item.MachineId,
                        avatar: item.Args['avatar'] || '{}',
                        animationDelay:0,
                    });
                    if (item.isSelf) {
                        globalData.value.self = item;
                    }
                    if(item.avatar.startsWith('http') == false){    
                        try{
                            item.avatar_ = JSON.parse(item.avatar || "{}");
                            item.avatar_style = `
                            line-height: 0;
                            font-family:${item.avatar_.ff || 'auto'};
                            font-size:${item.avatar_.fs||'none'};
                            color:${item.avatar_.fc || 'none'};
                            background-color:${item.avatar_.bc || 'none'}
                            `;
                            item.avatar_text = item.avatar_.ft ||  item.MachineName.split('')[0];
                        }catch(e){}
                    }else{
                        item.avatar_url = item.avatar;
                    }
                    
                }
                devices.page.Request = res.Request;
                devices.page.Count = res.Count;
                devices.page.List = res.List;
                devices.page._list = res.List.slice(0);
                for(let name in hooks) {
                    hooks[name].changed = true;
                }
                
                localStorage.setItem('device-count',devices.page.Count);
                nextTick(()=>{
                    window.dispatchEvent(new Event('resize'));
                });
                resolve()
            }).catch((err) => { resolve() });
        });
    }
    const _getSignList1 = () => {
        clearTimeout(devices.timer);
        getSignInList(devices.page.Request).then((res) => {
            for (let j in res.List) {
                const item = devices.page.List.filter(c => c.MachineId == res.List[j].MachineId)[0];
                if (item) {
                    Object.assign(item, {
                        Connected: res.List[j].Connected,
                        Version: res.List[j].Version,
                        LastSignIn: res.List[j].LastSignIn,
                        Args: res.List[j].Args,
                        showDel: machineId.value != res.List[j].MachineId && res.List[j].Connected == false,
                        showAccess: machineId.value != res.List[j].MachineId && res.List[j].Connected,
                        showReboot: res.List[j].Connected,
                        isSelf: machineId.value == res.List[j].MachineId,
                    });
                    if (item.isSelf) {
                        globalData.value.self = item;
                    }
                }
            }
            _handleSort();
            devices.timer = setTimeout(_getSignList1, 5000);
        }).catch((err) => {
            devices.timer = setTimeout(_getSignList1, 5000);
        });
    }
    const handlePageChange = (page) => {
        if (page) {
            devices.page.Request.Page = page;
            clearTimeout(devices.loadTimer);
            devices.loadTimer = setTimeout(_getSignList,300);
        }
    }
    const handlePageSizeChange = (size) => {
        if (size) {
            devices.page.Request.Size = size;
            localStorage.setItem('ps', size);
            clearTimeout(devices.loadTimer);
            devices.loadTimer = setTimeout(_getSignList,300);
        }
       
    }
    const deviceClearTimeout = () => {
        clearTimeout(devices.timer);
        clearTimeout(devices.timer1);
        devices.timer = 0;
        devices.timer1 = 0;
    }

    const _handleSort = ()=>{
        const prop = devices.page.Request.Prop;
        const asc = devices.page.Request.Asc;
        let list = devices.page._list.slice(1);
        switch(prop){
            case 'machineName':
                list = asc 
                ? list.sort((a,b)=> a.MachineName.localeCompare(b.MachineName))
                : list.sort((a,b)=> b.MachineName.localeCompare(a.MachineName));
            break;
            case 'version':
                list = asc 
                ? list.sort((a,b)=> a.Version.localeCompare(b.Version))
                : list.sort((a,b)=> b.Version.localeCompare(a.Version));
            break;
            case 'tunnel':
                try{
                list = asc 
                    ? list.sort((a,b)=> a.hook_tunnel_sort - b.hook_tunnel_sort )
                    : list.sort((a,b)=> b.hook_tunnel_sort - a.hook_tunnel_sort);
                }catch(e){}     
            break;
            case 'tuntap':
                try{
                    list = asc
                    ? list.sort((a,b)=> a.hook_tuntap_sort.localeCompare(b.hook_tuntap_sort))
                    : list.sort((a,b)=> b.hook_tuntap_sort.localeCompare(a.hook_tuntap_sort));  
                }catch(e){}          
            break;
            case 'forward':
                try{
                    list = asc
                    ? list.sort((a,b)=> a.hook_counter_forward_sort.localeCompare(b.hook_counter_forward_sort))
                    : list.sort((a,b)=> b.hook_counter_forward_sort.localeCompare(a.hook_counter_forward_sort));  
                }catch(e){}          
            break;
            case 'oper':
                try{
                    list = asc
                    ? list.sort((a,b)=> a.hook_counter_oper_sort.localeCompare(b.hook_counter_oper_sort))
                    : list.sort((a,b)=> b.hook_counter_oper_sort.localeCompare(a.hook_counter_oper_sort));  
                }catch(e){}          
            break;
            
            default:
            break;

        }
        list =  list.sort((a,b)=> b.Connected - a.Connected);    
        if(devices.page._list.length > 0){
            list.splice(0,0,devices.page._list[0]);
        }
        devices.page.List = list;
    }
    const handleSort = () => {
        localStorage.setItem('prop',devices.page.Request.Prop);
        localStorage.setItem('asc',devices.page.Request.Asc);   
        _handleSort();
    }
    const handleSearch = () => { 
        localStorage.setItem('search-name',devices.page.Request.Name || '');
        clearTimeout(devices.loadTimer);
        devices.loadTimer = setTimeout(_getSignList,300);
    }

    return {
        devices,deviceAddHook,deviceRefreshHook, deviceStartProcess, handlePageChange, handlePageSizeChange, deviceClearTimeout, handleSort,handleSearch
    }
}
export const useDevice = () => {
    return inject(deviceSymbol);
}