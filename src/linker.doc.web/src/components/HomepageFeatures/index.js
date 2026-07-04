import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: '打洞+中继+内网穿透',
        Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
        description: (
            <>
                牛逼
            </>
        ),
    },
    {
        title: '可视化UI管理',
        Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
        description: (
            <>
                牛逼
            </>
        ),
    },
    {
        title: '虚拟网卡+端口转发+socks5/http代理',
        Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
        description: (
            <>
                牛逼
            </>
        ),
    },
];

function Feature({ Svg, title, description }) {
    return (
        <div className={clsx('col col--4')}>
            <div style={{ border: '1px solid #ddd' }}>
                <div className="text--center">
                    <Svg className={styles.featureSvg} role="img" />
                </div>
                <div className="text--center padding-horiz--md">
                    <Heading as="h3">{title}</Heading>
                    <p>{description}</p>
                </div>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
