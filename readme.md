<!-- ---
title: 使用HTML5 Canvas编写的2D游戏库
date: 2020-11-05 03:10:23
intro: XOF是我业余时间试图编写的一个库，基于HTML5 Canvas，部分的逻辑代码参考了LayaAir、Egret
tags: typescript
tag: typescript
--- -->

在某次尝试做网页小游戏的时候，发现运行游戏至少需要一个`HTTP文件服务器`用于读取资源，而我的想法中并不需要，我印象中加载图片也并不需要，所以在这种情况下，我试着自己编写了一个游戏库。(事后发现部分引擎也不需要开`HTTP文件服务器`就能加载资源..难受..)

### 简单介绍
因为是在TypeScript上编写JS使用需要编译成JS文件，去除空行以及注释后代码总计1500行左右。
这个库渲染只有最简单的`节点`结构，只有2个基础组件Image、Label。并编写了基础的`鼠标事件`与手机`触屏事件`编写轻量小游戏应该是足够了。

正确初始化之后会创建一个根节点`XOF.stage`(这里学习了Laya的方式)，而之后的一切渲染对象都需要添加在`XOF.stage`的子节点列表中才能显示，使用`XOF.stage.addChild(obj)`方法来添加渲染对象，移除则使用`XOF.stage.removeChild(obj)`方法。

使用方式与现在大部分的2D引擎类似。


Github: https://github.com/imfox/XOF_engine
(叫做XOF完全是因为没想到好的名字就把FOX反过来使用了..笑)

### 如何使用
<!-- 使用这个库并显示`hello world`示例。 -->
```ts
// ts中使用
XOF.init(document, document.getElementById('gameMain') as any, 1280, 720);
let lab = new XOF.Label();
lab.text = "hello world";
lab.pos(5, 5);
XOF.stage.addChild(lab);
```

```js
// js中使用....
XOF.init(document, document.getElementById('gameMain'), 1280, 720);
let lab = new XOF.Label();
lab.text = "hello world";
lab.pos(5, 5);
XOF.stage.addChild(lab);
```


### 后记
这里附上我编写的一个DEMO: https://xfox.gitee.io/rain/

适用于编写自娱自乐的项目，商业项目还是乖乖的使用现在流行的引擎吧。
