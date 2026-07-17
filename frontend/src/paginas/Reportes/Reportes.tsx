import {
    BarChart3,
    TrendingUp,
    Package
} from "lucide-react";


function Reportes(){


    const productos = [
        {
            nombre:"Hamburguesa Clásica",
            ventas:80
        },
        {
            nombre:"Salchipapa Especial",
            ventas:60
        },
        {
            nombre:"Refresco",
            ventas:40
        }
    ];



    return(

        <div>


            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">

                <BarChart3/>

                Reportes

            </h1>



            <div className="grid md:grid-cols-3 gap-5 mb-6">


                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Ventas del día
                    </p>

                    <h2 className="text-3xl font-bold">
                        Bs. 1.250
                    </h2>

                </div>



                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Pedidos realizados
                    </p>

                    <h2 className="text-3xl font-bold">
                        45
                    </h2>

                </div>



                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Stock bajo
                    </p>

                    <h2 className="text-3xl font-bold text-red-600">
                        5
                    </h2>

                </div>


            </div>




            <div className="bg-white shadow rounded-xl p-6">


                <h2 className="text-xl font-bold mb-5 flex items-center gap-2">

                    <TrendingUp/>

                    Productos más vendidos

                </h2>



                <div className="space-y-4">


                {
                    productos.map((producto,index)=>(

                        <div
                        key={index}
                        className="flex justify-between border-b pb-3"
                        >


                            <span>
                                {producto.nombre}
                            </span>


                            <span className="font-bold">
                                {producto.ventas} ventas
                            </span>


                        </div>

                    ))
                }


                </div>


            </div>




            <div className="mt-6 bg-white shadow rounded-xl p-6">


                <h2 className="text-xl font-bold mb-4 flex gap-2">

                    <Package/>

                    Inventario

                </h2>


                <p className="text-gray-600">

                    Existen 5 insumos con stock inferior al mínimo permitido.

                </p>


            </div>



        </div>

    )

}


export default Reportes;